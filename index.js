const { Engine, Render, Runner, World, Bodies, Body, Events} = Matter;

const cellsHorizontal = 10;
const cellsVertical = 5;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;

const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width: width,
        height: height
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

const walls = [
    Bodies.rectangle(width/2, 0, width, 5, {isStatic: true}),
    Bodies.rectangle(0, height/2, 5, height, {isStatic: true}),
    Bodies.rectangle(width/2, height, width, 5, {isStatic: true}),
    Bodies.rectangle(width, height/2, 5, height, {isStatic: true}),

];

World.add(world, walls);

// Maze Generation

const shuffle = (arr) => {
    let counter = arr.length;

    while(counter > 0) {
        const index = Math.floor(Math.random() * counter);

        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
};
// Today I Learnt: arrow function with curly braces must have explicit return mentioned on the right hand side (or function body)
// arrow function without curly braces will automatically assume return the block on the right hand side
const grid = Array(cellsVertical)
    .fill(null)
    .map(() => {return Array(cellsHorizontal).fill(false)});

const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));
const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
    // If I have visited the cell at [row, column], then return
    if (grid[row][column]) {return;}
    // Mark this cell as being visited
    grid[row][column] = true;
    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
        [row - 1, column    , 'up'],
        [row    , column - 1, 'left'],
        [row + 1, column    , 'down'],
        [row    , column + 1, 'right']
    ]);

    // For each neighbor...
    for (neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;
        // See if that neighbor is out of bou nds
        if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
            continue;
        }
        // if we have visited the neighbor, continue to next neighbor
        if (grid[nextRow][nextColumn]) {
            continue;
        }
        // Remove a wall from either horizontals or verticals
        if (direction === 'left') {
            verticals[row][column - 1] = true;
        } else if (direction === 'right') {
            verticals[row][column] = true;
        } else if (direction === 'up') {
            horizontals[row - 1][column] = true;
        } else if (direction === 'down') {
            horizontals[row][column] = true;
        }
        // Visit that next cell
        stepThroughCell(nextRow,nextColumn);
    }

}


stepThroughCell(startRow,startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) return;
        const wall = Bodies.rectangle(
            unitLengthX * (columnIndex + 0.5),
            unitLengthY * (rowIndex + 1),
            unitLengthX,
            5,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, wall);
    })
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open) return;
        const wall = Bodies.rectangle(
            unitLengthX * (columnIndex + 1),
            unitLengthY * (rowIndex + 0.5),
            5,
            unitLengthY,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, wall);
    })
})

// Goal

const goalRow = Math.floor(Math.random() * cellsVertical);
const goalCol = Math.floor(Math.random() * cellsHorizontal);

const goal = Bodies.rectangle(
    unitLengthX * (goalCol + 0.5),
    unitLengthY * (goalRow + 0.5),
    unitLengthX * 0.5,
    unitLengthY * 0.5, 
    {
        isStatic: true,
        label: 'goal',
        render : {
            fillStyle: 'yellow'
        }
    },

);
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius, 
    {
        label: 'ball',
        render: {
            fillStyle: 'blue'
        }
    }
);
World.add(world, ball);

document.addEventListener('keydown', event => {
    const {x,y} = ball.velocity;

    if (event.keyCode === 87) {
        Body.setVelocity(ball, {x, y: y -5});
    } 
    if (event.keyCode === 68) {
        Body.setVelocity(ball, {x: x + 5, y});
    } 
    if (event.keyCode === 83) {
        Body.setVelocity(ball, {x, y: y + 5});
    } 
    if (event.keyCode === 65) {
        Body.setVelocity(ball, {x: x - 5, y});     
    }
});

// win condition

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];

        if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if(body.label === "wall") {
                    Body.setStatic(body, false);
                }
            })

        }
    });
})