const line = require("@line/bot-sdk");
const express = require("express");
const axios = require("axios").default;
const dotenv = require("dotenv");

const env = dotenv.config().parsed;
const app = express();

const lineConfig = {
    channelAccessToken: env.ACCESS_TOKEN,
    channelSecret: env.SECRET_TOKEN,
};

// Create LINE client
const client = new line.Client(lineConfig);

app.post("/webhook", line.middleware(lineConfig), async (req, res) => {
    try {
        const events = req.body.events;
        console.log("events =>", events);

        await Promise.all(events.map(async (event) => {
            if (event.type === "message" && event.message.type === "text") {
              if (event.message.text === "test flex message") {
                await sendFlexMessage(event.replyToken);
              } else {
                await handleEvent(event);
              }
            }
          }));
      
        res.status(200).send("OK");
    } catch (error) {
        console.error(error);
        res.status(500).end();
    }
});

const handleEvent = async (event) => {
    if (event.type !== "message" || event.message.type !== "text") {
        return null;
    }

    try {
        const { data } = await axios.get("https://api.edamam.com/search", {
            params: {
                q: event.message.text,
                app_id: env.EDAMAM_RECIPE_APP_ID,
                app_key: env.EDAMAM_RECIPE_APP_KEY,
            },
        });

        if (data.more) {
            const firstRecipe = data.hits[0].recipe;
            const recipeTitle = firstRecipe.label;
            const recipeImage = firstRecipe.image; // URL of the recipe image
            const recipeLink = firstRecipe.url;
            const nutrients = firstRecipe.totalNutrients; // This line fetches the nutrients object
            const servings = firstRecipe.yield;

            // Extract relevant nutrients (modify as needed)
            const calories = Math.round(nutrients.ENERC_KCAL.quantity);
            const carbs = Math.round(nutrients.CHOCDF.quantity);
            const fat = Math.round(nutrients.FAT.quantity);
            const protein = Math.round(nutrients.PROCNT.quantity);
            
            const replyMessage = [
                /*{
                    type: "image",
                    originalContentUrl: recipeImage,
                    previewImageUrl: recipeImage,
                },
                {
                    type: "text",
                    text:
                        `Here's a recipe for "${event.message.text}":\n` +
                        `${recipeTitle}\n` +
                        `${recipeLink}\n\n` +
                        `Nutritional Info:\n` +
                        `Calories: ${calories}kcal\n` +
                        `Carbs: ${carbs}g\n` +
                        `Fat: ${fat}g\n` +
                        `Protein: ${protein}g`,
                },*/
                {
                  type: "flex",
                  altText: "This is a flex message",
                  contents: {
                    type: "bubble",
                    hero: {
                      type: "image",
                      url: recipeImage,
                      size: "full",
                      aspectRatio: "3:2",
                      aspectMode: "cover",
                      action: {
                        type: "uri",
                        uri: recipeLink
                      }
                    },
                    body: {
                      type: "box",
                      layout: "vertical",
                      spacing: "xs",
                      action: {
                        type: "uri",
                        uri: recipeLink
                      },
                      contents: [
                        {
                          type: "text",
                          text: recipeTitle,
                          size: "xl",
                          weight: "bold"
                        },
                        {
                          type: "text",
                          text: `${servings} serving`,
                          size: "sm"
                        },
                        {
                          type: "box",
                          layout: "horizontal",
                          contents: [
                            {
                              type: "text",
                              text: `${calories}`,
                              weight: "bold",
                              decoration: "none",
                              style: "normal",
                              align: "end",
                              margin: "xxl",
                              size: "xxl",
                              offsetEnd: "xs",
                              gravity: "bottom"
                            },
                            {
                              type: "text",
                              text: "kcal",
                              align: "start",
                              gravity: "bottom",
                              offsetBottom: "md",
                              offsetStart: "xs"
                            }
                          ],
                          spacing: "none"
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          spacing: "md",
                          contents: [
                            {
                              type: "box",
                              layout: "baseline",
                              contents: [
                                {
                                  type: "icon",
                                  url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Eo_circle_green_blank.svg/512px-Eo_circle_green_blank.svg.png?20200417132254",
                                  size: "xxs",
                                  offsetTop: "none",
                                  offsetEnd: "none",
                                  offsetBottom: "none"
                                },
                                {
                                  type: "text",
                                  text: "Protein",
                                  weight: "regular",
                                  margin: "sm",
                                  flex: 6,
                                  size: "sm"
                                },
                                {
                                  type: "text",
                                  text: `${protein}`,
                                  margin: "xxl",
                                  weight: "bold",
                                  align: "end",
                                  offsetStart: "md"
                                },
                                {
                                  type: "text",
                                  text: "g",
                                  size: "sm",
                                  align: "end",
                                  color: "#aaaaaa",
                                  margin: "none"
                                }
                              ]
                            },
                            {
                              type: "box",
                              layout: "baseline",
                              contents: [
                                {
                                  type: "icon",
                                  url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Eo_circle_yellow_blank.svg/512px-Eo_circle_yellow_blank.svg.png?20200417182734",
                                  size: "xxs"
                                },
                                {
                                  type: "text",
                                  text: "Fat",
                                  weight: "regular",
                                  margin: "sm",
                                  flex: 6,
                                  size: "sm"
                                },
                                {
                                  type: "text",
                                  text: `${fat}`,
                                  flex: 1,
                                  margin: "xxl",
                                  weight: "bold",
                                  align: "end",
                                  offsetStart: "md"
                                },
                                {
                                  type: "text",
                                  text: "g",
                                  size: "sm",
                                  align: "end",
                                  color: "#aaaaaa"
                                }
                              ]
                            },
                            {
                              type: "box",
                              layout: "baseline",
                              contents: [
                                {
                                  type: "icon",
                                  url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Eo_circle_red_blank.svg/512px-Eo_circle_red_blank.svg.png?20200417173208",
                                  size: "xxs"
                                },
                                {
                                  type: "text",
                                  text: "Carb",
                                  weight: "regular",
                                  margin: "sm",
                                  flex: 6,
                                  size: "sm"
                                },
                                {
                                  type: "text",
                                  text: `${carbs}`,
                                  flex: 1,
                                  margin: "xxl",
                                  weight: "bold",
                                  align: "end",
                                  offsetEnd: "none",
                                  offsetStart: "md"
                                },
                                {
                                  type: "text",
                                  text: "g",
                                  size: "sm",
                                  align: "end",
                                  color: "#aaaaaa"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          type: "text",
                          text: "Sauce, Onions, Pickles, Lettuce & CheeseSauce, Onions, Pickles, Lettuce & CheeseSauce, Onions, Pickles, Lettuce & Cheese",
                          wrap: true,
                          color: "#aaaaaa",
                          size: "xxs",
                          maxLines: 2
                        }
                      ]
                    },
                    footer: {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "button",
                          style: "primary",
                          color: "#76BD43",
                          margin: "none",
                          action: {
                            type: "uri",
                            label: "View Recipe",
                            uri: recipeLink
                          }
                        }
                      ]
                    }
                  },
                }
                
            ];

            await client.replyMessage(event.replyToken, replyMessage);
        } else {
            await client.replyMessage(event.replyToken, {
                type: "text",
                text:
                    'Sorry, no recipes found for "' +
                    event.message.text +
                    '". Try a different search term.',
            });
        }
    } catch (error) {
        console.error(error);
        await client.replyMessage(event.replyToken, {
            type: "text",
            text: "An error occurred while searching for recipes. Please try again later.",
        });
    }
};

const sendFlexMessage = async (replyToken) => {
    const flexMessage = {
      type: "flex",
      altText: "This is a flex message",
      contents: {
        type: "bubble",
        direction: "ltr",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "This is a Flex Message",
              weight: "bold",
              size: "lg",
            },
            {
              type: "image",
              url: "https://via.placeholder.com/300x300", // Replace with your image URL
              size: "full",
            },
            {
              type: "text",
              text: "This is some text content",
              wrap: true,
              size: "md",
            },
          ],
        },
      },
    };
  
    await client.replyMessage(replyToken, flexMessage);
  };
  
app.listen(4000, () => {
    console.log("Server listening on port 4000");
});
