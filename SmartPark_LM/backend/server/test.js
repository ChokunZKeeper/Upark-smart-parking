<<<<<<< HEAD
colors = ['red', 'orange', 'green', 'blue', 'purple', 'dark']

const getRandomColor = () => {
    if (colors.length === 0) {
        return undefined
    }
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    console.log(typeof(randomColor))
}

getRandomColor()
=======
const { randomUUID } = require("node:crypto");

const abc = randomUUID();

console.log(abc.length);
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
