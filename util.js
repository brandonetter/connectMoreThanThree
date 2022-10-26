const colors = ["red", "blue", "pink", "green", "yellow", "white", "black"];
const generateUser = () => {
  let color = colors[Math.floor(Math.random() * colors.length)];
  let ran = (99 + Math.floor(Math.random() * 200)).toString(16);
  return (
    ran.toUpperCase() +
    color +
    new Date().getMilliseconds().toString().slice(1, 3)
  );
};
module.exports.generateUser = generateUser;
