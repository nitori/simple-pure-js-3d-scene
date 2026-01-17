/**
 * @typedef {Vec2|Vec3|Vec4} Vec
 */


/** */
class VecBase {
    /** @return {number[]} */
    values() {
        return Object.values(this);
    }

    size() {
        return Object.keys(this).length;
    }

    lengthSquared() {
        return this.values().reduce((acc, val) => acc + val * val, 0);
    }

    length() {
        return Math.sqrt(this.lengthSquared());
    }

    normalized() {
        let len = this.length();
        if (len === 0.0) {
            throw new Error('Cannot compute normalization on vector of length 0')
        }
        return new this.constructor(...(this.values().map(v => v / len)));
    }
}

export class Vec2 extends VecBase {
    /**
     * @param x {number}
     * @param y {number}
     */
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
    }
}

export class Vec3 extends VecBase {
    /**
     * @param x {number}
     * @param y {number}
     * @param z {number}
     */
    constructor(x, y, z) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }

    vec4() {
        return new Vec4(this.x, this.y, this.z, 1);
    }

    vec3() {
        return new Vec3(this.x, this.y, this.z);
    }
}

export class Vec4 extends VecBase {
    /**
     * @param x {number}
     * @param y {number}
     * @param z {number}
     * @param w {number}
     */
    constructor(x, y, z, w) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    vec4() {
        return new Vec4(this.x, this.y, this.z, this.w);
    }

    vec3() {
        return new Vec3(this.x, this.y, this.z);
    }
}

export class Mat4 {
    /**
     * @param vals {number[][]}
     */
    constructor(vals) {
        this.vals = vals;
    }

    clone() {
        return new Mat4(this.vals.map(row => row.map(val => val)));
    }

    /**
     * @return {Mat4}
     */
    static empty() {
        return new Mat4([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);
    }
}

/**
 * @template {Vec} T
 * @param v1 {T}
 * @param v2 {T|number}
 * @param operator {(a:number, b:number) => number}
 * @return T
 */
function op(v1, v2, operator) {
    let values;
    if (typeof v2 === 'number') {
        values = (new Array(v1.size())).fill(v2);
    } else if (v1.size() !== v2.size()) {
        throw new Error('mismatched vector size');
    } else {
        values = v2.values();
    }
    return new v1.constructor(...v1.values().map((a, i) => operator(a, values[i])));
}


/**
 * @template {Vec} T
 * @param v1 {T}
 * @param v2 {T|number}
 * @return T
 */
export function add(v1, v2) {
    return op(v1, v2, (a, b) => a + b);
}

/**
 * @template {Vec} T
 * @param v1 {T}
 * @param v2 {T|number}
 * @return T
 */
export function sub(v1, v2) {
    return op(v1, v2, (a, b) => a - b);
}

/**
 * @template {Vec} T
 * @param v1 {T}
 * @param v2 {T|number}
 * @return T
 */
export function mul(v1, v2) {
    return op(v1, v2, (a, b) => a * b);
}


/**
 * @template {Vec} T
 * @param v1 {T}
 * @param v2 {T|number}
 * @return T
 */
export function div(v1, v2) {
    return op(v1, v2, (a, b) => a / b);
}

/**
 * @param v1 {Vec3}
 * @param v2 {Vec3}
 * @return {Vec3}
 */
export function cross(v1, v2) {
    if (v1.size() !== 3 || v2.size() !== 3) {
        throw new Error('cross product vectors must be of the size 3');
    }
    return new Vec3(
        v1.y * v2.z - v1.z * v2.y,
        v1.z * v2.x - v1.x * v2.z,
        v1.x * v2.y - v1.y * v2.x
    );
}

/**
 * @param v1 {Vec2}
 * @param v2 {Vec2}
 * @return {number}
 */
export function cross2(v1, v2) {
    if (v1.size() !== 2 || v2.size() !== 2) {
        throw new Error('cross2 product vectors must be of the size 2');
    }

    return v1.x * v2.y - v1.y * v2.x;
}

/**
 * @template {Vec|number[]} T
 * @param v1 {T}
 * @param v2 {Vec|number[]}
 */
export function dot(v1, v2) {
    let vals1 = (v1 instanceof VecBase) ? v1.values() : v1;
    let vals2 = (v2 instanceof VecBase) ? v2.values() : v2;
    return vals1.reduce((acc, v, i) => acc + v * vals2[i], 0);
}

/**
 * @param m1 {Mat4|Transform}
 * @param m2 {Vec|Mat4|Transform}
 * @return {Vec|Mat4}
 */
export function matmul(m1, m2) {
    if (m1 instanceof Transform) {
        m1 = m1.matrix();
    }
    if (m2 instanceof Transform) {
        m2 = m2.matrix()
    }

    if (m2 instanceof Mat4) {
        // mat x mat
        const r0 = m1.vals[0];
        const r1 = m1.vals[1];
        const r2 = m1.vals[2];
        const r3 = m1.vals[3];

        const c0 = m2.vals.map(r => r[0]);
        const c1 = m2.vals.map(r => r[1]);
        const c2 = m2.vals.map(r => r[2]);
        const c3 = m2.vals.map(r => r[3]);

        return new Mat4([
            [dot(r0, c0), dot(r0, c1), dot(r0, c2), dot(r0, c3)],
            [dot(r1, c0), dot(r1, c1), dot(r1, c2), dot(r1, c3)],
            [dot(r2, c0), dot(r2, c1), dot(r2, c2), dot(r2, c3)],
            [dot(r3, c0), dot(r3, c1), dot(r3, c2), dot(r3, c3)],
        ]);

    } else {
        // mat x vec
        const r0 = m1.vals[0];
        const r1 = m1.vals[1];
        const r2 = m1.vals[2];
        const r3 = m1.vals[3];

        if (m2 instanceof Vec3) {
            m2 = new Vec4(...m2.values(), 1);
        }

        return new Vec4(dot(r0, m2), dot(r1, m2), dot(r2, m2), dot(r3, m2));
    }
}

export class Transform {

    /**
     * @param translation
     * @param scaling
     * @param rotation
     */
    constructor({translation, scaling, rotation} = {}) {
        this.translation = translation || Mat4.empty();
        this.scaling = scaling || Mat4.empty();
        this.rotation = rotation || Mat4.empty();
    }

    clone() {
        return new Transform({
            translation: this.translation.clone(),
            scaling: this.scaling.clone(),
            rotation: this.rotation.clone(),
        });
    }

    /**
     * @return {Mat4}
     */
    matrix() {
        return matmul(this.translation, matmul(this.rotation, this.scaling));
    }

    /**
     * @param x {number}
     * @param y {number}
     * @param z {number}
     * @return {Transform}
     */
    static fromTranslation(x, y, z) {
        return new Transform({
            translation: translationMat(x, y, z),
        });
    }

    /**
     * @param x {number}
     * @param y {number}
     * @param z {number}
     * @return {Transform}
     */
    static fromScaling(x, y, z) {
        return new Transform({
            scaling: scalingMat(x, y, z),
        });
    }

    /**
     * @param axis {Vec3|number[]}
     * @param angle {number}
     * @return {Transform}
     */
    static fromRotation(axis, angle) {
        return new Transform({
            rotation: rotationMat(axis, angle),
        });
    }

    /**
     * @param x {number}
     * @param y {number}
     * @param z {number}
     * @return {Transform}
     */
    withTranslation(x, y, z) {
        return new Transform({
            translation: translationMat(x, y, z),
            rotation: this.rotation.clone(),
            scaling: this.scaling.clone(),
        });
    }

    /**
     * @param x {number}
     * @param y {number}
     * @param z {number}
     * @return {Transform}
     */
    withScaling(x, y, z) {
        return new Transform({
            translation: this.translation.clone(),
            rotation: this.rotation.clone(),
            scaling: scalingMat(x, y, z),
        });
    }

    /**
     * @param axis {Vec3|number[]}
     * @param angle {number}
     * @return {Transform}
     */
    withRotation(axis, angle) {
        return new Transform({
            translation: this.translation.clone(),
            rotation: rotationMat(axis, angle),
            scaling: this.scaling.clone(),
        });
    }
}


/**
 * @param x {number}
 * @param y {number}
 * @param z {number}
 * @return {Mat4}
 */
function translationMat(x, y, z) {
    return new Mat4([
        [1, 0, 0, x],
        [0, 1, 0, y],
        [0, 0, 1, z],
        [0, 0, 0, 1],
    ]);
}

/**
 * @param x {number}
 * @param y {number}
 * @param z {number}
 * @return {Mat4}
 */
function scalingMat(x, y, z) {
    return new Mat4([
        [x, 0, 0, 0],
        [0, y, 0, 0],
        [0, 0, z, 0],
        [0, 0, 0, 1],
    ]);
}

/**
 * @param axis {Vec3|number[]}
 * @param angle {number}
 * @return {Mat4}
 */
function rotationMat(axis, angle) {
    axis = Array.isArray(axis) ? new Vec3(...axis) : axis;
    let {x, y, z} = axis.normalized();
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;
    return new Mat4([
        [t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0],
        [t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0],
        [t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0],
        [0, 0, 0, 1],
    ]);
}
