import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet')

players = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    username = request.args.get('username')
    if not username:
        return "Имя не указано", 400
    return render_template('game.html', username=username)

@socketio.on('new_player')
def on_new_player(data):
    sid = request.sid
    players[sid] = {
        'username': data['username'],
        'x': 1500,
        'y': 1500,
    }
    emit('players_update', players, broadcast=True)

@socketio.on('move')
def on_move(data):
    sid = request.sid
    if sid in players:
        players[sid]['x'] = data['x']
        players[sid]['y'] = data['y']
        emit('players_update', players, broadcast=True)

@socketio.on('disconnect')
def on_disconnect():
    sid = request.sid
    if sid in players:
        del players[sid]
        emit('players_update', players, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)
