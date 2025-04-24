import React, { useContext, useState } from "react";
import {
    View, Text, Image, TextInput, StyleSheet,
    TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { AppStyle } from "../../AppStyle";
import { CometChatContext, CometChatUIKit } from "@cometchat/chat-uikit-react-native";

export const SignIn = ({ navigation }) => {
    const [userId, setUserId] = useState('');
    const [isLoginInProgress, setLoginInProgress] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { theme } = useContext(CometChatContext);

    const handleLogin = () => {
        if (!userId.trim()) {
            setErrorMessage('User ID cannot be empty');
            return;
        }

        setErrorMessage('');
        setLoginInProgress(true);
        
        CometChatUIKit.login({ uid: userId.trim() })
            .then(user => {
                setLoginInProgress(false);
                navigation.navigate("ChatUserList");
            })
            .catch(error => {
                setLoginInProgress(false);
                console.log("Login error:", error);
                
                let message = "Login failed. Please try again.";
                if (error.code === "ERR_UID_NOT_FOUND") {
                    message = "User not found. Please check the User ID or create a new account.";
                } else if (error.code === "ERR_CONNECTION_FAILURE") {
                    message = "Connection failed. Please check your internet connection.";
                }
                
                setErrorMessage(message);
            });
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                {isLoginInProgress && (
                    <Modal transparent>
                        <View style={styles.modalBackground}>
                            <View style={styles.modalContent}>
                                <Image 
                                    style={styles.logo} 
                                    source={require("./logo.png")} 
                                />
                                <ActivityIndicator size="large" color={theme.palette.getPrimary()} />
                            </View>
                        </View>
                    </Modal>
                )}
                
                <View style={styles.content}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>

                    <View style={styles.formContainer}>
                        <Text style={styles.heading}>Login</Text>
                        <Text style={styles.subheading}>Enter your User ID</Text>

                        <TextInput
                            style={styles.input}
                            onChangeText={setUserId}
                            placeholder="Enter your User ID"
                            placeholderTextColor="#999"
                            value={userId}
                            autoCapitalize="none"
                        />

                        {errorMessage ? (
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        ) : null}

                        <TouchableOpacity
                            style={[
                                styles.loginButton, 
                                { backgroundColor: theme.palette.getPrimary() },
                                !userId.trim() && styles.disabledButton
                            ]}
                            disabled={!userId.trim() || isLoginInProgress}
                            onPress={handleLogin}>
                            <Text style={styles.loginButtonText}>
                                Login
                            </Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.helpText}>
                            Enter your User ID to log in. If you don't have one, go back and create a new account.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5"
    },
    modalBackground: {
        backgroundColor: "rgba(20,20,20,0.5)",
        flex: 1,
        justifyContent: "center"
    },
    modalContent: {
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        width: "80%",
        padding: 16,
        borderRadius: 16
    },
    logo: {
        height: 200,
        width: 200,
        marginBottom: 8,
        alignSelf: "center"
    },
    content: {
        backgroundColor: "#ffffff",
        margin: 16,
        flex: 1,
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    backButton: {
        marginTop: 8,
        marginBottom: 16
    },
    backButtonText: {
        color: "#4D8DFF",
        fontSize: 16,
        fontWeight: "bold"
    },
    formContainer: {
        flex: 1,
        marginTop: 8,
        marginBottom: 16
    },
    heading: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8
    },
    subheading: {
        fontSize: 16,
        color: "#666",
        marginBottom: 24
    },
    input: {
        height: 50,
        borderWidth: 1,
        padding: 12,
        borderRadius: 8,
        borderColor: "#ddd",
        backgroundColor: "#fff",
        color: "#333",
        fontSize: 16,
        marginBottom: 16
    },
    errorText: {
        color: "#f44336",
        marginBottom: 16
    },
    loginButton: {
        height: 50,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16
    },
    disabledButton: {
        opacity: 0.6
    },
    loginButtonText: {
        fontWeight: "bold",
        color: "white",
        fontSize: 16
    },
    helpText: {
        color: "#888",
        textAlign: "center",
        marginTop: 16,
        fontSize: 14
    }
});