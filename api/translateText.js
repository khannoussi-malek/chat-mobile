import axios from 'axios';

const TRANSLATION_API_KEY = '77bffdcee4c2491da09a511c415d47a2';
const TRANSLATION_ENDPOINT = 'https://api.cognitive.microsofttranslator.com/translate';

const translateText = async (text, targetLanguage) => {
  try {
    const response = await axios.post(
      `${TRANSLATION_ENDPOINT}?api-version=3.0&to=${targetLanguage}`,
      [{ text }],
      {
        headers: {
          'Ocp-Apim-Subscription-Key': TRANSLATION_API_KEY,
          'Content-type': 'application/json',
          'Ocp-Apim-Subscription-Region' : 'eastus'
        },
      }
    );

    return response.data[0].translations[0].text;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};

export default translateText;
