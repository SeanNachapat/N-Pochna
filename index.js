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

const client = new line.Client(lineConfig);

app.post("/webhook", line.middleware(lineConfig), async (req, res) => {
    try {
        const events = req.body.events;
        console.log("events =>", events);

        await Promise.all(events.map(async (event) => handleEvent(event)));
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
            const recipeImage = firstRecipe.image; 
            const recipeLink = firstRecipe.url;
            const nutrients = firstRecipe.totalNutrients; 
            
            const servings = Math.round(firstRecipe.yield / firstRecipe.yield);
            const calories = Math.round(nutrients.ENERC_KCAL.quantity / firstRecipe.yield);
            const carbs = Math.round(nutrients.CHOCDF.quantity / firstRecipe.yield);
            const fat = Math.round(nutrients.FAT.quantity / firstRecipe.yield);
            const protein = Math.round(nutrients.PROCNT.quantity / firstRecipe.yield);

            const dietLabels = firstRecipe.dietLabels || [];
            const allergenLabels = firstRecipe.healthLabels || [];

            const getAllLabels = (labels) => (labels.length > 0 ? labels.join(" · ") : "");
            
            const formattedDietLabels = getAllLabels(dietLabels);
            const formattedAllergenLabels = getAllLabels(allergenLabels);

            const walking = Math.round(calories / 100 * 1.6);
            const running = Math.round(calories / 60);
            const biking = Math.round(calories / 100 * 10)

            const replyMessage = [
                {
                  type: "flex",
                  altText: "This is a flex message",
                  contents: {
                    type: "bubble",
                    hero: {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "image",
                          url: recipeImage,
                          size: "full",
                          aspectRatio: "3:2",
                          aspectMode: "cover"
                        },
                        {
                          type: "image",
                          url: "https://media.discordapp.net/attachments/1128691062626594908/1250833533103116338/Untitled55_20240613222456.png?ex=666c6101&is=666b0f81&hm=5fe9ae2ef101c3be42322da1797ae94e4ee9e9f54662a91fd82ba719834d510b&=&format=webp&quality=lossless&width=479&height=701",
                          position: "absolute",
                          size: "170px",
                          aspectMode: "fit",
                          offsetStart: "150px",
                          offsetTop: "30px"
                        }
                      ]
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
                          text: `${servings / servings} serving`,
                          size: "sm"
                        },
                        {
                          type: "box",
                          layout: "horizontal",
                          contents: [
                            {
                              type: "text",
                              text: `${calories / servings}`,
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
                          layout: "horizontal",
                          contents: [
                            {
                              type: "image",
                              url: "https://media.discordapp.net/attachments/1128691062626594908/1250826209231634562/walking_1.png?ex=666c5a2f&is=666b08af&hm=b901082517956afca9728dad61313f33731e7c82ef26da11cba280ddcf3a3dc4&=&format=webp&quality=lossless",
                              size: "xxs"
                            },
                            {
                              type: "box",
                              layout: "vertical",
                              contents: [
                                {
                                  type: "text",
                                  text: `${walking}`
                                },
                                {
                                  type: "text",
                                  text: "Km",
                                  color: "#aaaaaa",
                                  size: "sm"
                                }
                              ]
                            },
                            {
                              type: "image",
                              url: "https://media.discordapp.net/attachments/1128691062626594908/1250826001622237304/running.png?ex=666c59fe&is=666b087e&hm=a83e40871de08b9d9e1b14711c100b0a7e984b81d24b557000460c94a71c3b44&=&format=webp&quality=lossless",
                              size: "xxs"
                            },
                            {
                              type: "box",
                              layout: "vertical",
                              contents: [
                                {
                                  type: "text",
                                  text: `${running}`
                                },
                                {
                                  type: "text",
                                  text: "Km",
                                  color: "#aaaaaa",
                                  size: "sm"
                                }
                              ]
                            },
                            {
                              type: "image",
                              url: "https://media.discordapp.net/attachments/1128691062626594908/1250826001915707482/bike.png?ex=666c59fe&is=666b087e&hm=8b8de306d686555da66f53d698c1cf7adcc182c6a4d0975bfff5236ba57e7bbd&=&format=webp&quality=lossless",
                              size: "xxs"
                            },
                            {
                              type: "box",
                              layout: "vertical",
                              contents: [
                                {
                                  type: "text",
                                  text: `${biking}`
                                },
                                {
                                  type: "text",
                                  text: "Min",
                                  size: "sm",
                                  color: "#aaaaaa"
                                }
                              ]
                            }
                          ],
                          paddingAll: "xs"
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
                                  text: `${protein / servings}`,
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
                                  text: `${fat / servings}`,
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
                                  text: `${carbs / servings}`,
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
                          text: `${formattedAllergenLabels}` +
                                `${formattedDietLabels}`,
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
app.listen(4000, () => {
    console.log("Server listening on port 4000");
});
