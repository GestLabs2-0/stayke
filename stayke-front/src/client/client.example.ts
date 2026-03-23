//////////////////// Imports ////////////////////
import { PublicKey } from "@solana/web3.js";

////////////////// Constantes ////////////////////
const n_biblioteca = "Alejandria"; // Nombre de la biblioteca
const owner = pg.wallet.publicKey; // Wallet

//////////////////// Client Test Logs ////////////////////
console.log("My address:", owner.toString()); // Ver el adress
const balance = await pg.connection.getBalance(owner);
console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`); // Ver el la cantidad de tokens de solana

//////////////////// FUNCIONES ////////////////////

//////////////////// OBTENER PDAs ////////////////////
/*
Un PDA representa una cuenta que es controlada por un programa (smart contract), y una de sus principales caracteristicas es no contar 
con una clave privada con la cual firmar al momento de realizar alguna transaccion (transferencia, escritura o modificacion de un dato) 
dentro del contrato. En su lugar, emplea direcciones generadas deterministicamente, es decir, recreables a partir de semillas. 
Las semillas pueden ser varias y de diferentes tipos, puede depender desde un valor predefenidio (como es usualmente el valor de la semilla 1), 
hasta de direcciones secundarias (como la del caller u otra cuenta).

Es por ello que para llamar desde el front una funcion del Solana Program desplegado es necesario contar con las semillas en su orden y tipo 
correspondiente. Se recomienda no usar valores sencillos (que no solo dependan de valores predefinidos), pero tampoco se encuentren 
compuestas de valores redundantes (como el program id o alguna cuenta padre).
*/
//////////////////// Biblioteca ////////////////////
function pdaBiblioteca(n_biblioteca) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("biblioteca"), // Semilla 1: b"biblioteca"
      Buffer.from(n_biblioteca), // Semilla 2: nombre de la biblioteca  -> String
      owner.toBuffer(), // Semilla 3: wallet -> Pubkey
    ],
    pg.PROGRAM_ID // Program ID: Siempre va al final
  );
}
//////////////////// Libro ////////////////////
function pdaLibro(n_libro) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("libro"), // Semilla 1: b"libro"
      Buffer.from(n_libro), // Semilla 2: nombre del libro: -> String
      owner.toBuffer(), // Semilla 3: wallet -> Pubkey
    ],
    pg.PROGRAM_ID // Program ID: Siempre va al final
  );
}

//////////////////// Crear Biblioteca ////////////////////
// Para crear la biblioteca solo es necesario el nombre que tendra
async function crearBiblioteca(n_biblioteca) {
  const [pda_biblioteca] = pdaBiblioteca(n_biblioteca); // Primero se obtiene la cuenta de la biblioteca

  const txHash = await pg.program.methods // mediante la libreria pg (solana playground) se acceden a los metodos del programa
    .crearBiblioteca(n_biblioteca) // crear biblioteca
    .accounts({
      // Se agregan las cuentas de las que depende (Contexto del struct NuevaBiblioteca)
      owner: owner,
      biblioteca: pda_biblioteca,
    })
    .rpc();

  console.log("txHash: ", txHash);
}

//////////////////// Agregar Libro ////////////////////
// Para crear un libro solo es necesario pasar el libro y el numero de paginas. El estado se define automaticamente en el programa
async function agregarLibro(n_libro, paginas) {
  // Agregar Libro
  const [pda_libro] = pdaLibro(n_libro); // se determina la cuenta del libro
  const [pda_biblioteca] = pdaBiblioteca(n_biblioteca); // se obtiene la cuenta de la biblioteca

  const txHash = await pg.program.methods
    .agregarLibro(n_libro, paginas) // agregar_libro
    .accounts({
      // cuentas del contexto
      owner: owner,
      libro: pda_libro,
      biblioteca: pda_biblioteca,
    })
    .rpc();

  console.log("txHash: ", txHash);
}

//////////////////// Alternar estado ////////////////////
// Para cambiar el estado de true a false o visceversa solo se necesita el nombre del libro
async function cambiarEstado(n_libro) {
  // Modificar Libro
  const [pda_libro] = pdaLibro(n_libro); // se determina la cuenta del libro
  const [pda_biblioteca] = pdaBiblioteca(n_biblioteca); // se obtiene la cuenta de la biblioteca

  const txHash = await pg.program.methods
    .alternarEstado(n_libro) // alternar_estado
    .accounts({
      // cuentas del contexto
      owner: owner,
      libro: pda_libro,
      biblioteca: pda_biblioteca,
    })
    .rpc();

  console.log("txHash: ", txHash);
}

//////////////////// Eliminar Libro ////////////////////
// Para eliminar un libro solo es necesario proporcionar el nombre del libro a eliminar de la biblioteca
async function eliminarLibro(n_libro) {
  // Eliminar Libro
  const [pda_libro] = pdaLibro(n_libro); // se determina la cuenta del libro
  const [pda_biblioteca] = pdaBiblioteca(n_biblioteca); // se obtiene la cuenta de la biblioteca
  const txHash = await pg.program.methods
    .eliminarLibro(n_libro) // eliminar_libro
    .accounts({
      // cuentas del contexto
      owner: owner,
      libro: pda_libro,
      biblioteca: pda_biblioteca,
    })
    .rpc();

  console.log("txHash: ", txHash);
}

//////////////////// Ver Libros ////////////////////
/*
 Anteriormente, en la version anterior de la biblioteca, esta instruccion se encotraba implementada dentro del Solana Program, pero... ¿porque ya no?
 En la prinmera version de la biblioteca los libros eran structs contenidos en un vector dentro de la cuenta biblioteca. Al ser elementos de un vector 
 su visualizacion era mas simple. En este caso, cada libro se encuentra definido por una cuenta, por lo que visualizar informacion de multiples cuentas 
 desde el Solana Program es ineficiente a comparacion de hacerlo desde el frontend. 

Para lograr hacerlo es necesario realizar los siguientes pasos:

1. Determinar el PDA de la biblioteca 
2. Obtener el vector de libros (direcciones)
3. Por cada direccion, obtener la informacion del libro 
4. Mostrarla con console.log
*/
async function verLibros(n_biblioteca) {
  // Ver Libros
  const [pda_biblioteca] = pdaBiblioteca(n_biblioteca); // se obtiene la cuenta de la biblioteca

  try {
    // Se accede a los datos de la cuenta (biblioteca)
    const bibliotecaAccount =
      await pg.program.account.biblioteca.fetch(pda_biblioteca);

    // Mediante el .length se obtiene el tamaño del vector de libros en laa biblioteca
    const numero_libros = bibliotecaAccount.libros.length;

    // Se verifican si hay libros en el vector
    if (!bibliotecaAccount.libros || numero_libros === 0) {
      console.log("Biblioteca vacía");
      return;
    }

    // Se imprime el valor en la consola
    console.log("Cantidad de libros:", numero_libros);

    // Se itera cada cuenta (libro) del vector (biblioteca) y se obtiene la informacion asociada
    for (let i = 0; i < numero_libros; i++) {
      const libroKey = bibliotecaAccount.libros[i];

      const libroAccount = await pg.program.account.libro.fetch(libroKey);

      // Finaliza mostrando en la terminal la informacion de cada libro
      console.log(
        `Libro #${i + 1}: \n * Nombre: ${libroAccount.nombre} \n * Páginas: ${
          libroAccount.paginas
        } \n * Biblioteca: ${libroAccount.biblioteca} \n * Disponible: ${
          libroAccount.disponible
        } \n * Dirección(PDA): ${libroKey.toBase58()}`
      );
    }
  } catch (error) {
    console.error("Error viendo libros:", error);

    // Debugging adicional
    if (error.message) {
      console.error("Mensaje de error:", error.message);
    }
    if (error.logs) {
      console.error("Logs del programa:", error.logs);
    }
  }
}

// crearBiblioteca(n_biblioteca);
// agregarLibro("El alquimista", 255);
// eliminarLibro("El alquimista");
// cambiarEstado("El alquimista");
// verLibros(n_biblioteca);

// solana confirm -v <txHash>
