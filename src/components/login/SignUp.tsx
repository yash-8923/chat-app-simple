import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { useContext, useState } from "react";
import { StyleSheet, View, Text, TextInput, Modal, ActivityIndicator, Image, TouchableOpacity, ScrollView } from "react-native";
import { AppConstants } from "../../../AppConstants";
import { CometChatContext, CometChatUIKit } from "@cometchat/chat-uikit-react-native";
import { NavigationProp, ParamListBase } from '@react-navigation/native';

interface SignUpProps {
    navigation: NavigationProp<ParamListBase>;
}

export const SignUp = ({ navigation }: SignUpProps) => {
    const [uid, setUID] = useState("");
    const [name, setName] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    
    const { theme } = useContext(CometChatContext);
    
    const handleCreateUser = () => {
        // Input validation
        if (!uid.trim()) {
            setErrorMessage("User ID is required");
            return;
        }
        
        if (!name.trim()) {
            setErrorMessage("Name is required");
            return;
        }
        
        setErrorMessage("");
        setIsProcessing(true);
        
        CometChat.createUser(
            { uid: uid.trim(), name: name.trim() }, 
            AppConstants.AUTH_KEY
        )
        .then(user => {
            console.log("User created successfully:", user);
            // Login with the created user
            CometChatUIKit.login({ uid: uid.trim() })
                .then(loggedInUser => {
                    setIsProcessing(false);
                    navigation.navigate("ChatUserList");
                })
                .catch(error => {
                    console.log("Login error:", error);
                    setIsProcessing(false);
                    setErrorMessage("User created but login failed. Please try logging in manually.");
                });
        })
        .catch(error => {
            console.log("Create user error:", error);
            setIsProcessing(false);
            
            if (error.code === "ERR_UID_ALREADY_EXISTS") {
                setErrorMessage("User ID already exists. Please try a different one.");
            } else {
                setErrorMessage("Failed to create user. Please try again.");
            }
        });
    };
    
    return (
        <ScrollView style={styles.container}>
            {isProcessing && (
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
                
                <Text style={styles.heading}>Create Account</Text>
                <Text style={styles.subheading}>Enter your details to register</Text>
                
                <TextInput
                    value={uid}
                    onChangeText={text => setUID(text)}
                    style={styles.input}
                    placeholder="Enter User ID"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                />
                
                <TextInput
                    value={name}
                    onChangeText={text => setName(text)}
                    style={styles.input}
                    placeholder="Enter Your Name"
                    placeholderTextColor="#999"
                />
                
                {errorMessage ? (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}
                
                <TouchableOpacity
                    style={[
                        styles.createButton,
                        { backgroundColor: theme.palette.getPrimary() },
                        (!uid.trim() || !name.trim()) && styles.disabledButton
                    ]}
                    disabled={!uid.trim() || !name.trim() || isProcessing}
                    onPress={handleCreateUser}>
                    <Text style={styles.createButtonText}>CREATE ACCOUNT</Text>
                </TouchableOpacity>
                
                <Text style={styles.helpText}>
                    Your User ID is unique and will be used to log in to your account.
                </Text>
            </View>
        </ScrollView>
    );
};

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
    createButton: {
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
    createButtonText: {
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