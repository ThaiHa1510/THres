// Reference the packages we require so that we can use them in creating the bot
var express = require('express');
var builder = require('botbuilder');
var footrecord=require('./locale/data/foodrecord.json');
const mongoose=require('mongoose');
mongoose.connect('mongodb://localhost:27017/restaurant');
var db=mongoose.connection;
db.on('error',console.error.bind(console, 'connection error:'));
const Room=require('./models/Room');
var now=new Date();
var sss=new Room({
    name:'222',
    breakfast:now.getHours(),
    number:3,

});

// =========================================================
// Bot Setup
// =========================================================
// Setup cho Express Server
// lang nghe cac request toi cong 4400 
var server = express();
server.listen(process.env.port || process.env.PORT || 4400, function () {
 console.log('%s listening to %s', server.name, server.url);
});
// Tao chatbot
var connector=new builder.ChatConnector({
     appId:'',
    appPassword:''});
    
var inMemoryStorage = new builder.MemoryBotStorage();

// Neu phuong thuc Post toi url /api/messages o cong 4400 thi ta chuyen toi bot connector xu ly
server.post('/api/messages', connector.listen());
server.use(express.static("public"));
// =========================================================
// Bots Dialogs 
// =========================================================
// Dau tien la  root dialog. No la dialog ma moi conversin luon bat dau tai day
var bot = new builder.UniversalBot(connector,{
       
}).set('storage', inMemoryStorage); // Luu lich su tro chuyen vao bo nho
bot.dialog('/',[function (session) {
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel)
        msg.attachments([
            new builder.HeroCard(session)
                .title("Cho mừng đến với nhà hàng TH ")
                .subtitle("Hân hạnh được phục vu quý khách")
                .text("Nhà hàng TH mang đến những món ăn tốt nhất cho bạn và gia đình bạn")
                .images([builder.CardImage.create(session, 'http://localhost:4400/image/upload/products/pho.jpg')])
                .buttons([
                    builder.CardAction.imBack(session, "Show", "Menu"),
                    builder.CardAction.imBack(session, "Hướng dẫn ", "Help"),
                    builder.CardAction.imBack(session, "Đặt bàn", "Đặt bàn")
                ])
            
        ]);
        session.send(msg).endDialog();
    
}]
);
var localeRecog = new builder.LocalizedRegExpRecognizer('Greetings', 
"localized_greetingRegExp");
bot.dialog('DatBan',[function(session,results){
    builder.Prompts.time(session, "Bạn muốn đặt bàn vòa ngày nào(ví dụ: 15/10/2018  5pm)");
   /* var msg = new builder.Message(session)
    .addAttachment({
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
            type: "AdaptiveCard",
            speak: "<s>Your  meeting about \"Adaptive Card design session\"<break strength='weak'/> is starting at 12:30pm</s><s>Do you want to snooze <break strength='weak'/> or do you want to send a late notification to the attendees?</s>",
               body: [
                    {
                        "type": "TextBlock",
                        "text": "Adaptive Card design session",
                        "size": "large",
                        "weight": "bolder"
                    },
                    {
                        "type": "TextBlock",
                        "text": "Conf Room 112/3377 (10)"
                    },
                    {
                        "type": "TextBlock",
                        "text": "12:30 PM - 1:30 PM"
                    },
                    {
                        "type": "TextBlock",
                        "text": "Snooze for"
                    },
                    {
                        "type": "Input.ChoiceSet",
                        "id": "snooze",
                        "style":"compact",
                        "choices": [
                            {
                                "title": "5 minutes",
                                "value": "5",
                                "isSelected": true
                            },
                            {
                                "title": "15 minutes",
                                "value": "15"
                            },
                            {
                                "title": "30 minutes",
                                "value": "30"
                            }
                        ]
                    }
                ],
                "actions": [
                    {
                        "type": "Action.OpenUrl",
                        "method": "POST",
                        "url": "http://foo.com",
                        "title": "Snooze"
                    },
                    {
                        "type": "Action.OpenUrl",
                        "method": "POST",
                        "url": "http://foo.com",
                        "title": "I'll be late"
                    },
                    {
                        "type": "Action.OpenUrl",
                        "method": "POST",
                        "url": "http://foo.com",
                        "title": "Dismiss"
                    }
                ]
        }
    });
    session.send(msg)*/
   
},function(session,results){
    session.dialogData.reservationDate = builder.EntityRecognizer.resolveTime([results.response]);
    session.beginDialog('askNumberInParty');
}]).endConversationAction(
    "endOrderDinner", "Ok. Goodbye.",
    {
        matches: /^tam biet$|^thoat$/i,
        confirmPrompt: "ban muon ket thuc?"
    }
).triggerAction(
    { matches: /^(Đặt bàn|tôi muốn đặt bàn)/i ,
     confirmPrompt:'Bạn muốn đặt bàn?',});

bot.dialog('askNumberInParty',[function(session,results){
    builder.Prompts.number(session,'Ban an co bao nhieu nguoi');
    
},function(session,results){
    
    session.dialogData.partySize=results.response;
    session.beginDialog('askNameParty');
    
}])
.triggerAction({
    matches: /^help$/i,
    confirmPrompt: "Bạn hủy bỏ yêu cầu .Ok?"
});
bot.dialog('askNameParty',[function(session,results){
    builder.Prompts.text(session,'Ban an ten gi');
    

},function(session,results){
    session.dialogData.nameParty=results.response;
    session.beginDialog('phonePrompt')
    
}
]).beginDialogAction('orderDinnerAction', 'orderDinner', { matches: /^order$/i });

bot.dialog('phonePrompt', [
    function (session, args) {
        if (args && args.reprompt) {
            builder.Prompts.text(session, "Hãy nhập số điện thoại dạng: '(012) 123-4567' or '098-123-4567' or '5551234567'")
        } else {
            builder.Prompts.text(session, "Hãy nhậpsố điện thoại của bạn?");
        }
    },
    function (session, results) {
        var matched = results.response.match(/\d+/g);
        var number = matched ? matched.join('') : '';
        console.log(session.dialogData.nameParty);
        if (number.length == 10 || number.length == 11) {
            session.dialogData.phonenumber=number;
           let s='Bạn đã đặt bàn vào ' +session.dialogData.reservationDate +' với'+session.dialogData.partySize+  ' ở '+session.dialogData.nameParty
            session.send(s);
        } else {
            session.replaceDialog('phonePrompt', { reprompt: true });
        }
    }
]);
var dinnerMenu = {
    "Potato Salad - $5.99": {
        Description: "Potato Salad",
        Price: 5.99
    },
    "Tuna Sandwich - $6.89": {
        Description: "Tuna Sandwich",
        Price: 6.89
    },
    "Clam Chowder - $4.50":{
        Description: "Clam Chowder",
        Price: 4.50
    }
};

bot.dialog('orderDinner', [
    function(session){
        session.send("Lets order some dinner!");
        builder.Prompts.choice(session, "Dinner menu:", footrecord.lunch);
    },
    function (session, results) {
        if (results.response) {
            var order = dinnerMenu[results.response.entity];
            session.dialogData.order = order;
            var msg = `You ordered: ${order.Description} for a total of $${order.Price}.`;
            session.send(msg);
            builder.Prompts.text(session, "What is your room number?");
        } 
    },
    function(session, results){
        if(results.response){
            session.dialogData.room = results.response;
            var msg = `Thank you. Your order will be delivered to room #${session.dialogData.room}`;
            session.endConversation(msg);
        }
    }
])
.triggerAction({
    matches: /^order dinner$/i,
    confirmPrompt: "This will cancel your order. Are you sure?"
});
   
bot.dialog('showMenu', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel);
    let x=0;
    var herocard=[];
    for (i in footrecord.breakfast.foodEaten) {
        let mua="mua mon"+" " +footrecord.breakfast.foodEaten[i].foodName;
       let herocards=new builder.HeroCard(session)
       .title(footrecord.breakfast.foodEaten[i].foodName)
       .subtitle(footrecord.breakfast.foodEaten[i].foodName)
       .text(footrecord.breakfast.foodEaten[i].Description)
       .images([builder.CardImage.create(session, footrecord.breakfast.foodEaten[i].Image)])
       .buttons([
           builder.CardAction.imBack(session, mua, "Mua")
       ]);
       herocard.push(herocards);
    }
    msg.attachments(herocard);
    session.send(msg).endDialog();
}).triggerAction({ matches: /^(show|list)/i });
bot.dialog('buyButtonClick', [
    function (session, args, next) {
        var utterance = args.intent.matched[0];
        var size = /\b(Extra Large|Large|Medium|Small)\b/i.exec(utterance);

         builder.Prompts.choice(session, "Bạn chọn size nào?", "Nhỏ|Vừa|Lớn|Khổng lồ");
        },
    function(session,results) {
        //Save size if prompted
        var item //= session.dialogData.item;
        if (results.response) {
            item = results.response.entity.toLowerCase();
        }

        // Add to cart
        if (!session.userData.cart) {
            session.userData.cart = [];
        }
        session.userData.cart.push(item);

        /*Send confirmation to user 
        session.dialogData.size=results.response.entity;*/
        builder.Prompts.choice(session,"Bạn tiếp tụ?","Yes|No",{listStyle: builder.ListStyle.button}); 
    },
    function(session,results){
        console.log(results.response.entity);
        if(results.response.entity=="Yes")
            session.beginDialog('showMenu');
        else
            session.send('Chúc bạn một ngày vui vẻ ').endDialog();
    }]).triggerAction({ matches: /(mua|add)\s.*mon/i });