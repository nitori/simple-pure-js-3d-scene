import {Vec3} from "./vec.js";

class Mesh {
    /**
     * @param points {Vec3[]|number[][]}
     * @param faces {number[][]}  list of point indexes
     */
    constructor(points, faces) {
        this.points = points.map(v => (v instanceof Vec3) ? v : new Vec3(v[0], v[1], v[2]));
        this.faces = faces.map(v => v);
    }

    /**
     * @param point {Vec3|number[]}
     */
    addPoint(point) {
        point = (point instanceof Vec3) ? point : new Vec3(point[0], point[1], point[2])
        this.points.push(point);
    }
}


export const boxMesh = new Mesh([
    [-1, -1, -1], //0
    [-1, -1, 1], //1
    [-1, 1, -1], //2
    [-1, 1, 1], //3
    [1, -1, -1], //4
    [1, -1, 1], //5
    [1, 1, -1], //6
    [1, 1, 1], //7
], [
    [0, 1, 3, 2],
    [4, 5, 7, 6],
    [0, 4],
    [1, 5],
    [3, 7],
    [2, 6],
]);

export const gridMesh = new Mesh([], []);

for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {
        gridMesh.addPoint([x, 0, z]);
        gridMesh.addPoint([x + 1, 0, z]);
        gridMesh.addPoint([x + 1, 0, z + 1]);
        gridMesh.addPoint([x, 0, z + 1]);
        let face = [
            gridMesh.points.length - 4,
            gridMesh.points.length - 3,
            gridMesh.points.length - 2,
            gridMesh.points.length - 1,
        ];
        gridMesh.faces.push(face);
    }
}
