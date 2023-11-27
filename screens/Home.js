import React, { useEffect } from "react";
import { View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from '@expo/vector-icons';
import colors from '../config/colors';
import { Entypo } from '@expo/vector-icons';
import { auth, database } from '../config/firebase';
import { updateProfile } from 'firebase/auth';
import { collection, query, where, onSnapshot } from "firebase/firestore";

const Home = () => {

    const navigation = useNavigation();

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

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <FontAwesome name="search" size={24} color={colors.gray} style={{marginLeft: 15}}/>
            ),
            headerRight: () => (
                <Image
                    source={{ uri: 'https://cdn.icon-icons.com/icons2/2716/PNG/512/user_circle_icon_172814.png' }}
                    style={{
                        width: 40,
                        height: 40,
                        marginRight: 15,
                    }}
                />
            ),
        });
    }, [navigation]);

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
