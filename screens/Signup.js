import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Image, SafeAreaView, TouchableOpacity, StatusBar, Alert, ScrollView } from "react-native";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, database } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
const backImage = require("../assets/backImage.png");



// signup screen
export default function Signup({ navigation }) {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // handle signup with username, email, and password
    // firebase auth
    const onHandleSignup = () => {
        if (name !== '' && email !== '' && password !== '') {
            createUserWithEmailAndPassword(auth, email, password)
            .then(function() {
                console.log("Signup Success");
                addDoc(collection(database, 'usernames'), {
                    email,
                    name
                });
            })
            .catch((err) => Alert.alert("Signup Error", err.message));
        }
    };
    
    // return view for signup screen
    return (
        <View style={styles.container}>
            <Image source={backImage} style={styles.backImage} />
            <View style={styles.whiteSheet} />
            <SafeAreaView style={styles.form}>
            <Text style={styles.title}>Sign Up</Text>
            <ScrollView automaticallyAdjustKeyboardInsets={true} showsVerticalScrollIndicator={false}>
                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    autoCapitalize="none"
                    textContentType="name"
                    autoFocus={false}
                    value={name}
                    onChangeText={(text) => setName(text)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoFocus={false}
                    value={email}
                    onChangeText={(text) => setEmail(text)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={true}
                    textContentType="password"
                    value={password}
                    onChangeText={(text) => setPassword(text)}
                    onSubmitEditing={onHandleSignup}
                />
            </ScrollView>
            <TouchableOpacity style={styles.button} onPress={onHandleSignup}>
                <Text style={{fontWeight: 'bold', color: '#fff', fontSize: 18}}> Sign Up</Text>
            </TouchableOpacity>
            <View style={{marginTop: 20, flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 25}}>
                <Text style={{color: 'gray', fontWeight: '600', fontSize: 14}}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                    <Text style={{color: '#081736', fontWeight: '600', fontSize: 14}}> Log In</Text>
                </TouchableOpacity>
            </View>
            </SafeAreaView>
            <StatusBar barStyle="light-content" />
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 36,
        marginTop: 150,
        fontWeight: 'bold',
        color: "#081736",
        alignSelf: "center",
        paddingBottom: 60,
    },
    input: {
        backgroundColor: "#F6F7FB",
        height: 58,
        marginTop: 10,
        marginBottom: 10,
        fontSize: 16,
        borderRadius: 10,
        padding: 12,
    },
    backImage: {
        width: "100%",
        height: 340,
        position: "absolute",
        top: 0,
        resizeMode: 'cover',
    },
    whiteSheet: {
        width: '100%',
        height: '75%',
        position: "absolute",
        bottom: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 60,
    },
    form: {
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: 30,
        marginTop: 125
    },
    button: {
        backgroundColor: '#081736',
        height: 58,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    }
});
