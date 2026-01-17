import {Mat4, Vec3, sub, cross, dot} from "./vec.js";

/**
 * @param fov {number}
 * @param aspect {number}
 * @param near {number}
 * @param far {number}
 * @return {Mat4}
 */
export function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    return new Mat4([
        [f / aspect, 0, 0, 0],
        [0, f, 0, 0],
        [0, 0, (far + near) * nf, (2 * far * near) * nf],
        [0, 0, -1, 0],
    ]);
}

/**
 * @param eye {Vec3|number[]}
 * @param target {Vec3|number[]}
 * @param up {Vec3|number[]}
 * @return {Mat4}
 */
export function lookAt(eye, target, up) {
    eye = Array.isArray(eye) ? new Vec3(...eye) : eye;
    target = Array.isArray(target) ? new Vec3(...target) : target;
    up = Array.isArray(up) ? new Vec3(...up) : up;

    const f = sub(target, eye).normalized();
    const s = cross(f, up).normalized();
    const u = cross(s, f);

    return new Mat4([
        [s.x, s.y, s.z, -dot(s, eye)],
        [u.x, u.y, u.z, -dot(u, eye)],
        [-f.x, -f.y, -f.z, dot(f, eye)],
        [0, 0, 0, 1],
    ]);
}

/**
 * @param eye {Vec3}
 * @param target {Vec3}
 * @return {{yaw: number, pitch: number}}
 */
export function toYawPitch(eye, target) {
    const forward = sub(target, eye).normalized();
    let yaw = Math.atan2(forward.x, -forward.z);
    let pitch = Math.asin(forward.y);
    return {yaw, pitch};
}

/**
 * @param yaw {number}
 * @param pitch {number}
 * @returns {Vec3}
 */
export function forwardDirection(yaw, pitch) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    return (new Vec3(sy * cp, sp, -cy * cp)).normalized();
}

/**
 * @param yaw {number}
 * @param pitch {number}
 * @param eye {Vec3}
 * @return {Vec3} new target
 */
export function fromYawPitch(yaw, pitch, eye) {
    const forward = forwardDirection(yaw, pitch);
    return new Vec3(
        eye.x + forward.x,
        eye.y + forward.y,
        eye.z + forward.z,
    );
}
