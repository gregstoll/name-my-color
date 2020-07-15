declare module "colorlab" {
    declare class CIELAB {
        constructor(l: number, a: number, b: number);
    }

    declare function CIEDE2000(color1: CIELAB, color2: CIELAB) : number;
}