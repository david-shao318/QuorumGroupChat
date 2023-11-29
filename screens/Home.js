import React, { useEffect } from "react";
import { View, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from '@expo/vector-icons';
import colors from '../config/colors';
import { Entypo } from '@expo/vector-icons';
import { auth, database } from '../config/firebase';
import { updateProfile } from 'firebase/auth';
import { collection, query, where, onSnapshot } from "firebase/firestore";


// home screen
// TODO: add search feature to header
// TODO: add multiple chat group functionality and display in chat list
const Home = () => {

    const navigation = useNavigation();

    const userPicAlert = () =>
        Alert.prompt('Add a Profile Picture', 'Enter the URL to Your Photo', [
                {text: 'OK', onPress: (text) => {
                    const usernamesQuery = query(collection(database, 'usernames'), where('email', '==', auth?.currentUser?.email));
                    onSnapshot(usernamesQuery, (querySnapshot) => {
                        querySnapshot.forEach((doc) => {
                            updateProfile(auth.currentUser, {
                                photoURL: text
                            }).then(() => console.log('Photo added: ', doc.data().name))
                            .catch(error => console.log('Error adding photo: ', error));
                        });
                    });
                }},
                {
                    text: 'Cancel',
                    onPress: () => console.log('Canceled photo update'),
                    style: 'cancel',
                },
            ],
            'plain-text',
            auth?.currentUser?.photoURL,
            'url'
        );

    // update username upon first login
    if (auth?.currentUser?.displayName === null) {
        const usernamesQuery = query(collection(database, 'usernames'), where('email', '==', auth?.currentUser?.email));
        onSnapshot(usernamesQuery, (querySnapshot) => {
          querySnapshot.forEach((doc) => {
            updateProfile(auth.currentUser, {
              displayName: doc.data().name
            }).then(() => console.log('Username added: ', doc.data().name))
              .catch(error => console.log('Error adding username: ', error));
          });
        });
    }

    // set header options
    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <FontAwesome name="search" size={24} color={colors.gray} style={{marginLeft: 15}}/>
            ),
            headerRight: () => {
                if (auth?.currentUser?.photoURL === null)
                    return (
                        <TouchableOpacity onPress={userPicAlert}>
                            <Image
                                source={require('../assets/user.png')}
                                style={{
                                    width: 40,
                                    height: 40,
                                    marginRight: 15,
                                    borderRadius: 20
                                }}
                            />
                        </TouchableOpacity>
                    );
                else
                    return (
                        <TouchableOpacity onPress={userPicAlert}>
                            <Image
                                source={{ uri: auth?.currentUser?.photoURL }}
                                style={{
                                    width: 40,
                                    height: 40,
                                    marginRight: 15,
                                    borderRadius: 20
                                }}
                            />
                        </TouchableOpacity>
                    );
            },
        });
    }, [navigation]);

    // navigate to chat screen
    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => navigation.navigate("Chat")}
                style={styles.chatButton}
            >
                <Entypo name="chat" size={24} color={colors.lightGray} />
            </TouchableOpacity>
        </View>
    );
};

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        backgroundColor: "#fff",
    },
    chatButton: {
        backgroundColor: colors.primary,
        height: 50,
        width: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: .9,
        shadowRadius: 8,
        marginRight: 20,
        marginBottom: 50,
    }
});
