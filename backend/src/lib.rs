use wasm_bindgen::prelude::*;

// Cube structure with 6 faces, each with a 3x3 grid of colors.
#[wasm_bindgen]
pub struct Cube {
    faces: [[char; 9]; 6],
}

#[wasm_bindgen]
impl Cube {
    // Create a new cube with a default solved state.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Cube {
        Cube {
            faces: [
                ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'], // White face
                ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'], // Green face
                ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'], // Red face
                ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'], // Blue face
                ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'], // Orange face
                ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'], // Yellow face
            ],
        }
    }

    // Accept a cube state from JS as an array of 54 chars (6 faces x 9 stickers)
    #[wasm_bindgen]
    pub fn from_state(state: &str) -> Cube {
        let mut faces = [[ 'W'; 9 ]; 6];
        let chars: Vec<char> = state.chars().collect();
        for i in 0..6 {
            for j in 0..9 {
                faces[i][j] = chars[i * 9 + j];
            }
        }
        Cube { faces }
    }

    // Function to print the cube's faces.
    pub fn print_cube(&self) {
        for (i, face) in self.faces.iter().enumerate() {
            println!("Face {}:", i + 1);
            for row in face.chunks(3) {
                println!("{:?}", row);
            }
            println!();
        }
    }

    // A basic example of a cube solver (this could be improved).
    #[wasm_bindgen]
    pub fn solve(&self) -> String {
        // In a real solver, we'd implement a solving algorithm here.
        // For now, it just returns a dummy solution.
        String::from("Solution: Rotate the cube in XYZ directions.")
    }
}

// Basic unit test to check if the Cube is created correctly.
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cube_creation() {
        let cube = Cube::new();
        cube.print_cube();
        assert_eq!(cube.faces[0][0], 'W'); // Checking if the top-left color of the first face is white.
    }

    #[test]
    fn test_solver() {
        let cube = Cube::new();
        let solution = cube.solve();
        assert_eq!(solution, "Solution: Rotate the cube in XYZ directions.");
    }
}
