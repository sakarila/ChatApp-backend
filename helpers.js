const findLoggedUsers = async (io) => {
  const sockets = io.in('loggedUsers');
  const users = Object.keys(sockets.sockets).map((item) => {
    return { username: sockets.sockets[item].username, socketID: sockets.sockets[item].id }           
  });
  return users;
}

exports.findLoggedUsers = findLoggedUsers;