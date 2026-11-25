colors = ['red', 'orange', 'green', 'blue', 'purple', 'dark']

const getRandomColor = () => {
    if (colors.length === 0) {
        return undefined
    }
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    console.log(typeof(randomColor))
}

getRandomColor()