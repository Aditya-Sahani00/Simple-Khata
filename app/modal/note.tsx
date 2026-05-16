import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { loadData, saveData, STORAGE_KEYS } from "@/utils/storage";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function NoteModal() {
  const insets = useSafeAreaInsets();
  const { colors, primary } = useTheme();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const savedNotes = await loadData<Note[]>(STORAGE_KEYS.NOTES || "sk_notes", []);
    setNotes(savedNotes);
  };

  const saveNotes = async (newNotes: Note[]) => {
    await saveData(STORAGE_KEYS.NOTES || "sk_notes", newNotes);
    setNotes(newNotes);
  };

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert("Empty Note", "Please add a title or content.");
      return;
    }

    const now = new Date().toISOString();
    
    if (editingNote) {
      // Update existing note
      const updatedNotes = notes.map(n => 
        n.id === editingNote.id 
          ? { ...n, title: title.trim() || "Untitled", content: content.trim(), updatedAt: now }
          : n
      );
      saveNotes(updatedNotes);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Create new note
      const newNote: Note = {
        id: generateId(),
        title: title.trim() || "Untitled",
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
      };
      saveNotes([newNote, ...notes]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setTitle("");
    setContent("");
    setEditingNote(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            const updatedNotes = notes.filter(n => n.id !== id);
            saveNotes(updatedNotes);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      ]
    );
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsCreating(true);
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[styles.noteCard, { backgroundColor: colors.card }]}
      onPress={() => handleEdit(item)}
      activeOpacity={0.8}
    >
      <View style={styles.noteHeader}>
        <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.noteContent, { color: colors.textSecondary }]} numberOfLines={3}>
        {item.content || "No content"}
      </Text>
      <Text style={[styles.noteDate, { color: colors.textMuted }]}>
        {new Date(item.updatedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (isCreating) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top + 10 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            setIsCreating(false);
            setEditingNote(null);
            setTitle("");
            setContent("");
          }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {editingNote ? "Edit Note" : "New Note"}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={{ color: primary, fontSize: 16, fontWeight: "600" }}>Save</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
          placeholder="Title"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          autoFocus
        />
        
        <TextInput
          style={[styles.contentInput, { color: colors.text }]}
          placeholder="Write your note..."
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notes</Text>
        <TouchableOpacity onPress={() => setIsCreating(true)}>
          <Ionicons name="add-circle" size={28} color={primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notes Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Tap the + button to create your first note
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  noteCard: {
    borderRadius: 14,
    padding: 16,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contentInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
