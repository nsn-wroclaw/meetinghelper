/**
 * Part of application responsible for connection.
 */

/**
 * Przykład wywołania funkcji, której argumentem jest callb, co będzie uznawane jako
 * nazwa innej funkcji - callbacku ( devices.qrCode.scan(callb) ).
 *
 * devices.qrCode.scan(function(result) {
 *     alert(result);
 * });
 *
 * Taka funkcja, po wykonaniu skanowania, uruchomi z argumentem (u nas result) funkcję
 * podaną jako argument.
 */

/**
 * Przykład użycia funkcji wywoływanej podczas przyjścia wiadomości ze strony serwera.
 *
 * connection.socket.receive.onNewPhoto = function(data) {};
 *
 * Polega to na przypisaniu nowej funkcji, wywoływanej przy danej akcji.
 */

var states = {
	unknown_host: 'unknown_host',
	wrong_host: 'wrong_host',
	established: 'established',
	connecting: 'connecting',
	disconnected: 'disconnected'
};

var connection = {
	url: '',
	state: states.unknown_host,

	states: states,

	callback: undefined,

	_callback: function(message) {
		if (connection.callback) {
		    connection.callback(message);
	    } else {
	    	callback(message);
	    }
	},

	setUrl: function(url) {
		connection.url = '';
		connection.state = connection.states.connecting;
		connection.action.ping(url, function(result) {
			result = JSON.parse(result);
			if (result.message === connectionAnswers.ping) {
				connection.url = url;
				try {
					connection.socket.init(url);
				} catch(e) {
					connection._callback(e);
					connection.state = connection.states.disconnected;
				}
				connection.state = connection.states.established;
				if (connection.onSetUrl) {
					connection.onSetUrl();
				}
			}
		});
	},

	onSetUrl: undefined,

	action: {
		types: {
			get: "GET",
			post: "POST"
		},

		_base: function(type, link, value, callb, ping) {
			try {
				if (connection.state === connection.states.established || ping) {
				    var xmlHttp = null;

				    xmlHttp = new XMLHttpRequest();

				    xmlHttp.onreadystatechange = function() {
						if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
						    if (callb) {
						    	callb(xmlHttp.responseText);
						    } else {
						    	connection._callback(xmlHttp.responseText);
						    }
						}
					}

				    xmlHttp.open( type, connection.url + link, true );

				    if (type === connection.action.types.post) {
						value = JSON.stringify(value);
						xmlHttp.setRequestHeader("Content-Type", "application/json; charset=utf-8");
					}
				    xmlHttp.send( value );

				} else if (connection.state === connection.states.connecting) {
					connection._callback('Connecting...\nPlease check your connection.');
				} else if (connection.state === connection.states.wrong_host) {
					connection._callback('Wrong url');
				} else if (connection.state === connection.states.unknown_host) {
					connection._callback('No url is set');
				} else {
					connection._callback('Unknown exception');
				}
			} catch(e) {
			    if (callb) {
					callb("an error occured");
					callb(e);
			    } else {
					connection._callback("an error occured");
					connection._callback(e);
			    }
			}
		},
		ping: function(link, callb) {
			connection.action._base(
				connection.action.types.get,
				link + connectionLinks.get.ping,
				null,
				connection.receive._onPong(callb),
				true);
		},
		hello: function(callb) {
			connection.action._base(
				connection.action.types.get,
				connectionLinks.hello,
				null, callb);
		},
		mac: function(callb) {
			if (connection.mac.value) {
				connection.action._base(
					connection.action.types.post,
					connectionLinks.post.mac,
					connection.mac.value, callb);
			}
		},
		login: function(login, password, callb) {
			connection.action._base(
				connection.action.types.post,
				connectionLinks.post.login,
				{login: login, password: password},
				connection.receive.onLogin(callb));
		},
		register: function(login, password, password2, callb) {
			if (password === password2) {
				connection.action._base(
					connection.action.types.post,
					connectionLinks.post.register,
					{login: login, password: password},
					connection.receive.onRegister(callb));
			} else {
				callb("passwords are not equal");
			}
		},
		createRoom: function(room, callb) {
			connection.action._base(
				connection.action.types.get,
				connectionLinks.get.rooms.create + room,
				null,
				connection.receive.onCreateRoom(callb));
		},
		joinRoom: function(room, callb) {
			connection.action._base(
				connection.action.types.get,
				connectionLinks.get.rooms.join + room,
				null,
				connection.receive.onJoinRoom(callb));
		},
		getRooms: function(callb) {
			connection.action._base(
				connection.action.types.get,
				connectionLinks.get.rooms.all,
				null,
				connection.receive.onReceiveRooms(callb));
		},
		getRoomData: function(roomId, callb) {
			connection.action._base(
				connection.action.types.get,
				connectionLinks.get.rooms.data,
				{roomId: roomId},
				connection.receive.onReceiveRoomData(callb));
		}
	},

	receive: {
		_base: function(callb) {
			return function(data) {
				if (callb) {
					callb(data);
				} else {
					connection._callback(data);
				}
			}
		},
		_onPong: function(callb) {
			return connection.receive._base(callb);
		},
		onLogin: function(callb) {
			return connection.receive._base(callb);
		},
		onRegister: function(callb) {
			return connection.receive._base(callb);
		},
		onCreateRoom: function(callb) {
			return connection.receive._base(callb);
		},
		onJoinRoom: function(callb) {
			return connection.receive._base(callb);
		},
		onReceiveRooms: function(callb) {
			return connection.receive._base(callb);
		},
		onReceiveRoomData: function(callb) {
			return connection.receive._base(callb);
		}
	},

	file: {
		upload: {
			photo: function(imageSrc, onProgress) {
				if (connection.url) {
					var options = new FileUploadOptions();
					options.fileKey="file";
					options.fileName=imageSrc.substr(imageSrc.lastIndexOf('/')+1);
					options.mimeType="image/jpeg";

					var params = new Object();
					params.value1 = "test";
					params.value2 = "param";

					options.params = params;

					var ft = new FileTransfer();

					if (onProgress) {
						ft.onprogress = function(progressEvent) {
							onProgress(progressEvent);
							connection.file.upload._onProgress(progressEvent);
						};
					} else {
						ft.onprogress = connection.file.upload._onProgress;
					}
					ft.upload(
						imageSrc,
						connection.url + connectionLinks.uploadFile,
						connection.file.upload._success,
						connection.file.upload.fail,
						options);
				} else {
					connection._callback('No url is set');
				}
			},

			onProgress: undefined,

			_onProgress: function(progressEvent) {
				if (connection.file.upload.onProgress) {
					connection.file.upload.onProgress(progressEvent);
				} else {
					//old part of progress; to be moved to function docs
					//On Android an iOS, lengthComputable is false for downloads that use gzip encoding.
					/*if (progressEvent.lengthComputable) {
						loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
					} else {
						loadingStatus.increment();
					}*/
				}
			},

			success: undefined,

			_success: function(message) {
				connection._callback(
					"Code = " + message.responseCode + "\n" +
					"Response = " + message.response + "\n" +
					"Sent = " + message.bytesSent);

				if (connection.file.upload.success) {
					connection.file.upload.success(message.response);
				}
			},

			fail: function(error) {
				connection._callback(
					"An error has occurred: Code = " + error.code + "\n" +
					"upload error source " + error.source + "\n" +
					"upload error target " + error.target);
			}
		},

		download: {
			photo: function(fileUrl, filePath) {
				if (connection.url) {
					var ft = new FileTransfer();
					var uri = encodeURI(connection.url + connectionLinks.getPhoto + fileUrl);

					ft.onprogress = connection.file.download._onProgress;
					ft.download(
						uri,		//link to download
						filePath,	//file path to save
						connection.file.download._success,
						connection.file.download.fail, false);
				} else {
					connection._callback('No url is set');
				}
			},

			onProgress: undefined,

			_onProgress: function(progressEvent) {
				if (connection.file.download.onProgress) {
					connection.file.download.onProgress(progressEvent);
				} else {
					/*if (progressEvent.lengthComputable) {
						loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
					} else {
						loadingStatus.increment();
					}*/
				}
			},

			success: undefined,

			_success: function(message) {
				connection._callback("download complete: " + message.fullPath);

				if (connection.file.download.success) {
					connection.file.download.success(message);
				}
			},

			fail: function(error) {
				connection._callback(
					"An error has occurred: Code = " + error.code + "\n" +
					"download error source " + error.source + "\n" +
					"download error target " + error.target);
			}
		}
	},

	socket: {
		instance: undefined,

		states: {
			open: 'open',
			closed: 'closed'
		},

		state: undefined,

		init: function(link) {
			connection.socket.instance = io.connect(link);

			connection.socket.state = connection.socket.states.open;

			connection.socket.instance.on(webSocketBroadcast.newPhoto, connection.socket.receive._onNewPhoto);
			connection.socket.instance.on(webSocketBroadcast.newUser, connection.socket.receive._onNewUser);
			connection.socket.instance.on(webSocketBroadcast.newMessage, connection.socket.receive._onNewMessage);
			connection.socket.instance.on(webSocketBroadcast.newComment, connection.socket.receive._onNewComment);
		},

		send: function(event, object) {
			if (connection.socket.state === connection.socket.states.open) {
				connection.socket.instance.emit(event, object);
			} else {
				connection._callback('Socket is in closed state');
			}
		},

		testSend: function(message) {
			connection.socket.send(webSocketSend.test, message);
		},

		enterRoom: function(userId, roomId) {
			alert(userId + ' ' + roomId);
			connection.socket.send(webSocketSend.enterRoom, {user: userId, room: roomId});
		},

		receive: {
			onNewPhoto: undefined,

			/**
			 * In data.message is received message.
			 */
			_onNewPhoto: function (data) {
				connection._callback(JSON.stringify(data));

				if (connection.socket.receive.onNewPhoto) {
					connection.socket.receive.onNewPhoto({
						userId: data.message.user,
						type: 'photo',
						data: connection.url + connectionLinks.get.photo + data.message
					});
				}
			},

			onNewUser: undefined,

			/**
			 * In data.message is received message.
			 */
			_onNewUser: function (data) {
				connection._callback('_onNewUser: ' + JSON.stringify(data));

				if (connection.socket.receive.onNewUser) {
					connection.socket.receive.onNewUser({
						userId: data.user.id,
						type: 'user',
						data: data
					});
				}
			},

			onNewMessage: undefined,

			/**
			 * In data.message is received message.
			 */
			_onNewMessage: function (data) {
				connection._callback(JSON.stringify(data));

				if (connection.socket.receive.onNewMessage) {
					connection.socket.receive.onNewMessage({
						userId: data.message.user,
						type: 'message',
						data: data.message
					});
				}
			},

			onNewComment: undefined,

			/**
			 * In data.message is received message.
			 */
			_onNewComment: function (data) {
				connection._callback(JSON.stringify(data));

				if (connection.socket.receive.onNewComment) {
					connection.socket.receive.onNewComment({
						userId: data.message.user,
						type: 'comment',
						target: connection.url + connectionLinks.get.photo + data.message,
						data: data.message.data
					});
				}
			}
		}
	}
};
connection.socket.state = connection.socket.states.closed;