import React, {
  useState,
  useLayoutEffect,
  useCallback
} from 'react';
import { TouchableOpacity } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import {
  collection,
  addDoc,
  orderBy,
  query,
  onSnapshot,
  getCountFromServer,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, database } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import colors from '../config/colors';

import { encodeSecret, decodeSecret } from '../utils/shamirsecretsharing';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';


global.numUsers = 2;
global.quorum = 2;


export default function Chat() {

  const [messages, setMessages] = useState([]);
  const navigation = useNavigation();

  const onSignOut = () => {
    signOut(auth).catch(error => console.log('Error logging out: ', error));
  };

  useLayoutEffect(() => {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={{
              marginRight: 10
            }}
            onPress={onSignOut}
          >
            <AntDesign name="logout" size={24} color={colors.gray} style={{marginRight: 10}}/>
          </TouchableOpacity>
        )
      });
    }, [navigation]);

  useLayoutEffect(() => {
      const collectionRef = collection(database, 'chats');
      const q = query(collectionRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          setMessages(querySnapshot.docs.map((doc) => {
            let availableShares = [];
            for (const [user, share] of Object.entries(doc.data().shares)) {
              if (doc.data().usersSeen.includes(user)) {
                availableShares.push(share);
              } else if (user == auth?.currentUser?.email) {
                availableShares.push(share);
                updateDoc(doc.ref, {
                  usersSeen: [...doc.data().usersSeen, user]
                });
              }
            }

            let messageHex = decodeSecret(availableShares);
            let messageText = Buffer.from(messageHex, 'hex').toString('utf-8').replace(/\uFFFD/g, '');

            return {
              _id: doc.data()._id,
              createdAt: doc.data().createdAt.toDate(),
              text: messageText,
              user: doc.data().user
            };
          })
        );
      });
      return unsubscribe;
    }, []);

  const onSend = useCallback((messages = []) => {
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, messages)
      );

      let { _id, createdAt, text, user } = messages[0];

      // Shamir's secret sharing to encode the message into n shares,
      // where n is the number of users in the chat
      // QUORUM is set to n (all users must be present to decode the message)
      // TODO: change QUORUM to be a user-defined value
      getCountFromServer(collection(database, "usernames")).then((snapshot) => {
        global.numUsers = snapshot.data().count;
        global.quorum = global.numUsers;
      }).then(() => {
        console.log(global.numUsers, global.quorum);
        let encrypted = encodeSecret(text, Math.max(global.numUsers, 2), global.quorum);
        let sharesByUser = {};
        console.log(encrypted);

        const collectionRef = collection(database, 'usernames');
        const q = query(collectionRef, orderBy('name', 'desc'));
        querySnapshot = getDocs(q).then((querySnapshot) => {
          let i = 0
          querySnapshot.forEach((doc) => {
            sharesByUser[doc.data().email] = encrypted[i++];
          });
        }).then(() => {
          addDoc(collection(database, 'chats'), {
            _id,
            createdAt,
            text,
            user,
            usersSeen: [auth?.currentUser?.email],
            shares: sharesByUser
          })
        })
      }).then(() => {
        console.log('Message sent');
      }).catch(error => console.log('Error sending message: ', error));
    }, []);

  return (
      <GiftedChat
        messages={messages}
        showAvatarForEveryMessage={false}
        showUserAvatar={false}
        renderUsernameOnMessage={true}
        onSend={(messages) => { onSend(messages) }}
        messagesContainerStyle={{
          backgroundColor: '#fff'
        }}
        textInputStyle={{
          backgroundColor: '#fff',
          borderRadius: 20,
        }}
        user={{
          _id: auth?.currentUser?.email,
          name: auth?.currentUser?.displayName,
          avatar: 'https://cdn.icon-icons.com/icons2/2716/PNG/512/user_circle_icon_172814.png'
        }}
      />
    );
}
