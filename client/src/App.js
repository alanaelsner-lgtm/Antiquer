import { useState } from 'react';
import './App.css';
import AuthScreen from './screens/AuthScreen';
import CharacterScreen from './screens/CharacterScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';

export default function App() {
  const [player, setPlayer] = useState(null);
  const [roomCode, setRoomCode] = useState(null);

  // Determine which screen to show
  if (!player) {
    return <AuthScreen onLogin={setPlayer} />;
  }

  if (!player.character) {
    return <CharacterScreen player={player} onDone={setPlayer} />;
  }

  if (!roomCode) {
    return <LobbyScreen player={player} onEnterGame={setRoomCode} />;
  }

  return <GameScreen player={player} roomCode={roomCode} />;
}
