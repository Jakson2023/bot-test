require("dotenv").config();
const {
  Bot,
  Keyboard,
  GrammyError,
  HttpError,
  InlineKeyboard,
} = require("grammy");
const { getRandomQuestion, getCorrectAnswer } = require("./utils");

const bot = new Bot(process.env.BOT_API_KEY);

bot.command("start", async (ctx) => {
  const startKeyboard = new Keyboard()
    .text("HTML/CSS")
    .text("JavaScript")
    .text("React")
    .resized();
  await ctx.reply("Я бот, який допоможе вивчити основні питання по темах \u2198 ");
  await ctx.reply("Вибери тему та отримай випадкове питання \u2705", {
    reply_markup: startKeyboard,
  });
});

bot.hears(["HTML/CSS", "JavaScript", "React", "Node", "Randomquestion"], async (ctx) => {
  const topic = ctx.message.text.toLowerCase();
  const {question, questionTopic} = getRandomQuestion(topic);

  let inlineKeyboard;

  if (question.hasOptions) {
    const buttonRows = question.options.map((option) => 
       [
        InlineKeyboard.text(
          option.text,
          JSON.stringify({
            type: `${questionTopic}-option`,
            isCorrect: option.isCorrect,
            questionId: question.id,
          })
        ),
      ]
    );

    inlineKeyboard = InlineKeyboard.from(buttonRows)
  } else {
    inlineKeyboard = new InlineKeyboard().text(
      "\u2611 Подивитись відповідь \u2611",
      JSON.stringify({
        type: questionTopic,
        questionId: question.id,
      })
    );
  }

  await ctx.reply(question.text, { reply_markup: inlineKeyboard });
});




bot.on("callback_query:data", async (ctx) => {
 

  const callbackData = JSON.parse(ctx.callbackQuery.data);

if(!callbackData.type.includes('option')){

    const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
    await ctx.reply(answer, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
    });
    await ctx.answerCallbackQuery();
    return;

}

if(callbackData.isCorrect){
    await ctx.reply(' Ok! \u2705');
    await ctx.answerCallbackQuery();
    return
}
const answer = getCorrectAnswer(callbackData.type.split('-')[0], callbackData.questionId);
await ctx.reply(`Not correct! Correct :${answer}`);
await ctx.answerCallbackQuery();
});





bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start();
