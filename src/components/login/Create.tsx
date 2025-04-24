import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationProp, ParamListBase } from '@react-navigation/native';

interface CreateProps {
    navigator: NavigationProp<ParamListBase>;
}

export const Create = ({ navigator }: CreateProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.promptText}>
                Don't have any users?
            </Text>
            <TouchableOpacity onPress={() => navigator.navigate("SignUp")}>
                <Text style={styles.createText}>CREATE NOW</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        width: "100%",
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16
    },
    promptText: {
        color: '#666',
        fontSize: 14
    },
    createText: {
        color: '#4D8DFF',
        fontWeight: 'bold',
        marginHorizontal: 8,
        fontSize: 14
    }
});