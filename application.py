import os
import json

from flask import Flask, render_template, flash, redirect
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from collections import deque

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app)

channels = {"general": deque([], maxlen=100)}
print(channels)

@app.route("/")
def index():
    return render_template("index.html", channels=channels)


@socketio.on('new username')
def new_username(data):
    username = data["username"]
    print(username)
    emit("add username",{"username":username})


@socketio.on('new channel')
def add_channel(data):
    channelName = data["channelName"]
    print(channelName)

    # Store channelName in a dict if it is unique. 
    if not channelName in channels:
        print(channels)
        # Update channels with a new channel name
        channels[data['channelName']] = deque([], maxlen=100)
        print(channels)
        # Then inform everyone about the new channel
        emit("add channel", {'channelName': data['channelName']}, broadcast=True)
    else:
        # TODO grazinti error
        print("false")
        return False


@socketio.on('join')
def on_join(data):
    channel = data['channelName']
    print('join' + channel)
    join_room(channel)

    messages_array = []
    for message in list(channels[channel]):
        messages_array.append(json.dumps(message))
    print(messages_array)
    emit('roomMessages', messages_array)
   

@socketio.on('leave')
def on_leave(data):
    channel = data['channelName']
    print('leave' + channel)
    leave_room(channel)


@socketio.on('new message')
def new_message(data):
    channel = data["channel"]
    message = data["message"]
    username = data["username"]
    time = data["time"]
    
    print("message: " + message)
    full_message = {"username":username, "message":message, "time":time}
    print("full_message: " + str(full_message))
    channels[channel].append(full_message)

    # Show everyone a new message
    emit("message", {'message':message, 'channel':channel, 'username':username, 'time':time}, room=channel)


if __name__ == '__main__':
    socketio.run(app, debug=True, use_reloader=True)