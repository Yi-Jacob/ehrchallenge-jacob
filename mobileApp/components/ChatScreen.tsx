import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'therapist';
}

const WS_URL = 'wss://echo.websocket.org'; // Demo echo server

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);
    ws.current.onmessage = (e) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + Math.random() + '', text: e.data, sender: 'therapist' },
      ]);
    };
    return () => {
      ws.current?.close();
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() && ws.current && ws.current.readyState === 1) {
      ws.current.send(input);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + '', text: input, sender: 'me' },
      ]);
      setInput('');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Therapist DM (Stub)</Text>
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.message, item.sender === 'me' ? styles.me : styles.therapist]}>
              <Text style={styles.text}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Button title="Send" onPress={sendMessage} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: '80%',
  },
  me: {
    backgroundColor: '#d1e7dd',
    alignSelf: 'flex-end',
  },
  therapist: {
    backgroundColor: '#f8d7da',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 8,
    fontSize: 16,
  },
});

export default ChatScreen; 