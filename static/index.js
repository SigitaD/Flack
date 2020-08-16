$(document).ready(function () {

    console.log("this is my jquery")

    var socket = io();
    socket.on("connect", function () {
        socket.emit("my event", { data: "I'm connected!" });
    });


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ADD USERNAME ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Display modal if local storage does not store any username
    // IN OTHER WORDS: "socket.on('connect', function() {". Note for myself: nenaudoti lambda su "this".
    socket.on('connect', () => {
        console.log("connect");
        if (!localStorage.username) {
            $(".modal").modal({ backdrop: "static", keyboard: false });
            $(".modal-title").text("Please enter your username");
            $("#modalInput").attr('disabled', true);
        // If local storage contains channel name, display it as active
        } else if (localStorage.channel_name) {
            $('#channel-list li:contains("' + localStorage.channel_name + '")').toggleClass('active').siblings().removeClass('active');
            $("#room").text(localStorage.channel_name);
            socket.emit('join', { 'channelName': localStorage.channel_name })
        }
        
        //Do not let send msg or add channel before storing username (if somebody would remove modal by inspecting page in a browser) 
        $("#add-channel").attr('disabled', true);
        $("#msg-send").attr('disabled', true);
    });

    // Validate username
    $("#username-text").on('keyup', function (key) {
        if ($(this).val().trim().length > 0) {
            $("#modalInput").attr('disabled', false);
            if (key.keyCode == 13) {
                $('#modalInput').click();
            }
        }
        else {
            $("#modalInput").attr('disabled', true);
        }
    });

    // Send username from modal to socket
    // IN OTHER WORDS: $("#modalInput").on('click', function () {
    $("#modalInput").on('click', () => {
        var username = $('#username-text').val();
        socket.emit('new username', { 'username': username })
    });

    // Store gotten username into local storage
    // IN OTHER WORDS: socket.on('add username', function(data) {
    socket.on('add username', data => {
        localStorage.setItem('username', data["username"])
    });
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~ end of ADD USERNAME ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ADD CHANNEL ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Validate new channel name
    $("#channel-name").on('keyup', function (key) {
        if ($(this).val().trim().length > 0) {
            $("#add-channel").attr('disabled', false);
            if (key.keyCode == 13) {
                $('#add-channel').click();
            }
        }
        else {
            $("#add-channel").attr('disabled', true);
        }
    });

    $("#add-channel").on('click', () => {
        var channelName = $('#channel-name').val();
        // Inform everyone about the new channel
        socket.emit('new channel', { 'channelName': channelName })
    });

    socket.on('add channel', data => {
        // New channel name
        var newChannel = data["channelName"]
        // Update UI with new channel. Add it to the list
        $("#channel-list").append("<li class=list-group-item>" + newChannel + "</li>");
        $('#channel-list li:last-child').click(activeChannel());
        $("#channel-name").val("");
    });
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ end of ADD CHANNEL ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ACTIVE CHANNEL ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    $('.list-group-item').click(activeChannel());

    function activeChannel() {
        return function () {
            // Add active class on click. Do not allow to click again on a channel with active class.
            if (!$(this).hasClass("active")) {
                $(this).toggleClass('active').siblings().removeClass('active');
                var lastActiveChannel = $('.active').text();
                console.log(lastActiveChannel);
        
                // Store active channel to local storage
                localStorage.setItem('channel_name', lastActiveChannel);
                // Set title of active channel in html
                $("#room").text(localStorage.channel_name);
        
                // Leave and join rooms. After leaving a room, empty msg list
                socket.emit('leave', { 'channelName': localStorage.channel_name });
                $("#msg-list").empty();
                socket.emit('join', { 'channelName': localStorage.channel_name });
            }
        };
    }
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ end of ACTIVE CHANNEL ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ MESSAGING ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // TODO: style messages
    // TODO: div turi pasiskrolinti zemyn pats, jei netelpa zinutes, su kiekviena nauja zinute

    // Display messages
    socket.on('roomMessages', data => {
        console.log("data: " + data)
        data.forEach(full_message => {
            message = JSON.parse(full_message)
            console.log("full_message: " + full_message)
            console.log("message: " + message)
            console.log("message.username: " + message.username)
            console.log("message.message: " + message.message)
            console.log("message.time: " + message.time)
            $("#msg-list").append("<li class=list-group-item>" + message.username + ": " + message.message + " (" + message.time + ")" + "</li>");
        })
    });
     
    // Validate messages before sending
    $("#msg-text").on('keyup', function(key) {
        if ($(this).val().trim().length > 0 && localStorage.channel_name !== undefined) {
            $("#msg-send").attr('disabled', false);
            if (key.keyCode==13) {
                $('#msg-send').click();
            }
        }
        else{
            $("#msg-send").attr('disabled', true);
        }
    });

    // Send message from <form> to socket
    $("#msg-send").on('click', () => {
        var message = $('#msg-text').val();
        time = new Date().toLocaleString()
        channel = localStorage.channel_name

        console.log("message: " + message)
        console.log("channel: " + channel)
        console.log("username: " + localStorage.username)
        console.log("time: " + time)

        socket.emit('new message', { 'message': message, 'channel': channel, 'username': localStorage.username, 'time': time })
    });

    // Display a new message
    socket.on('message', data => {
        var newMessage = data["message"]
        var channel = data["channel"]
        var channelStorage = localStorage.channel_name
        var username = data["username"]
        var time = data['time']

        console.log("newMessage: " + newMessage)
        console.log("channel: " + channel)
        console.log("channelStorage: " + channelStorage)
        console.log("username: " + username)
        console.log("time: " + time)

        $("#msg-list").append("<li class=list-group-item>" + username + ": " + newMessage + " (" + time + ")" + "</li>");

        $("#msg-text").val("");
    });
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ end of MESSAGING ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    // Prevent "enter" key from refreshing a page
    $('form').bind('keypress keydown keyup', function (e) {
        if (e.keyCode == 13) { e.preventDefault(); }
    });

});
