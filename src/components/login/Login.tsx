import React, { useContext, useState, useEffect } from "react";
import { 
    View, 
    Text, 
    Image, 
    SafeAreaView, 
    ActivityIndicator, 
    Modal, 
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import { Create } from "./Create";
import { CometChatContext, CometChatUIKit } from "@cometchat/chat-uikit-react-native";
import { NavigationProp, ParamListBase } from '@react-navigation/native';

interface LoginProps {
    navigation: NavigationProp<ParamListBase>;
}

export const Login = ({ navigation }: LoginProps) => {
    const [isLoginInProgress, setLoginInProgress] = useState(false);
    const { theme } = useContext(CometChatContext);

    useEffect(() => {
        // Check if user is already logged in
        CometChatUIKit.getLoggedInUser()
            .then(user => {
                if (user != null) {
                    navigation.navigate("ChatUserList");
                }
            })
            .catch(e => {
                console.log("Unable to get loggedInUser", e);
            });
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {isLoginInProgress && (
                <Modal transparent>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContent}>
                            <ActivityIndicator size="large" color={theme.palette.getPrimary()} />
                            <Text style={styles.loadingText}>Logging in...</Text>
                        </View>
                    </View>
                </Modal>
            )}
            
            <View style={styles.contentContainer}>
                <View style={styles.headerContainer}>
                    <Text style={styles.appTitle}>Simple Chat App</Text>
                    <Text style={styles.appSubtitle}>Connect and chat in real-time</Text>
                </View>
                
                <View style={styles.buttonContainer}>
                    <Text style={styles.instructionText}>
                        Sign in with your User ID or create a new account to get started
                    </Text>
                    
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: theme.palette.getPrimary() }]}
                        onPress={() => navigation.navigate("SignIn")}>
                        <Text style={styles.loginButtonText}>
                            Sign In with User ID
                        </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.createAccountContainer}>
                        <Create navigator={navigation} />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5"
    },
    modalBackground: {
        backgroundColor: "rgba(0,0,0,0.5)",
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: 24,
        borderRadius: 12,
        alignItems: "center",
        width: "80%"
    },
    contentContainer: {
        flex: 1,
        padding: 24
    },
    headerContainer: {
        alignItems: "center",
        marginTop: 40,
        marginBottom: 60
    },
    appTitle: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 12
    },
    appSubtitle: {
        fontSize: 18,
        color: "#666"
    },
    buttonContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20
    },
    instructionText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 30,
        lineHeight: 24
    },
    loginButton: {
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        marginBottom: 24
    },
    loginButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold"
    },
    createAccountContainer: {
        marginTop: 16
    },
    loadingText: {
        color: "#666",
        marginTop: 12,
        fontSize: 16
    }
});