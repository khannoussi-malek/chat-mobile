import * as Location from 'expo-location';

export async function sendLocation() {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    setErrorMsg('Permission to access location was denied');
    return;
  }

  let location = await Location.getCurrentPositionAsync({});
  const latitude = location.coords.latitude;
  const longitude = location.coords.longitude;
  const message = `https://www.google.com/maps?q=${latitude},${longitude}`;
  return message;
}
