const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios').default;
const dotenv = require('dotenv');

const env = dotenv.config().parsed;
const app = express();

const lineConfig = {
  channelAccessToken: env.ACCESS_TOKEN,
  channelSecret: env.SECRET_TOKEN
};

// Create LINE client
const client = new line.Client(lineConfig);

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events;
    console.log('events =>', events);

    await Promise.all(events.map(async (event) => handleEvent(event)));
    res.status(200).send('OK');

  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

const handleEvent = async (event) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  try {
    const { data } = await axios.get('https://api.edamam.com/search', {
      params: {
        q: event.message.text,
        app_id: env.EDAMAM_RECIPE_APP_ID,
        app_key: env.EDAMAM_RECIPE_APP_KEY
      }
    });

    if (data.more) {
      const firstRecipe = data.hits[0].recipe;
      const recipeTitle = firstRecipe.label;
      const recipeImage = firstRecipe.image; // URL of the recipe image
      const recipeLink = firstRecipe.url;
      const nutrients = firstRecipe.totalNutrients; // This line fetches the nutrients object

      // Extract relevant nutrients (modify as needed)
      const calories = Math.round(nutrients.ENERC_KCAL.quantity);
      const carbs = Math.round(nutrients.CHOCDF.quantity);
      const fat = Math.round(nutrients.FAT.quantity);
      const protein = Math.round(nutrients.PROCNT.quantity);

      const replyMessage = [
        {
          type: 'image',
          originalContentUrl: recipeImage,
          previewImageUrl: recipeImage
        },
        {
          type: 'text',
          text: `Here's a recipe for "${event.message.text}":\n` +
                `${recipeTitle}\n` +
                `${recipeLink}\n\n` +
                `Nutritional Info:\n` +
                `Calories: ${calories}kcal\n` +
                `Carbs: ${carbs}g\n` +
                `Fat: ${fat}g\n` +
                `Protein: ${protein}g`
        }
      ];

      await client.replyMessage(event.replyToken, replyMessage);
    } else {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'Sorry, no recipes found for "' + event.message.text + '". Try a different search term.'
      });
    }
  } catch (error) {
    console.error(error);
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'An error occurred while searching for recipes. Please try again later.'
    });
  }
};

app.listen(4000, () => {
  console.log('Server listening on port 4000');
});
