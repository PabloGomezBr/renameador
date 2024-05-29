# 🛠️ Tiniest Renaming Tool - Renameador

Welcome to the Tiniest Renaming Tool, a simple yet powerful tool for renaming your files and directories with ease! 🚀

<!-- ![Renameador Logo](path/to/logo.png) Add your logo image here -->

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 About

The Tiniest Renaming Tool, also known as Renameador, helps you batch rename files and directories efficiently. Whether you're looking to remove characters from the start or end of filenames, Renameador has got you covered.

---

## ✨ Features

- 🗂️ **Batch Rename**: Rename multiple files and directories at once.
- 🔍 **Preview Changes**: Preview the changes before applying them.
- 🔄 **Flexible Options**: Choose to remove characters from the start or end.
- 🛡️ **Conflict Detection**: Detects and handles conflicts intelligently.

---

## 💾 Installation

### Option 1: Download Executables

You can use Renameador without cloning the repository by downloading the executable for your operating system:

- [Download for Windows](https://github.com/PabloGomezBr/renameador/releases/download/v1.0.0/renameador-windows.exe)
- [Download for Linux](https://github.com/PabloGomezBr/renameador/releases/download/v1.0.0/renameador-linux)
- [Download for macOS](https://github.com/PabloGomezBr/renameador/releases/download/v1.0.0/renameador-macos)


Make sure to give the executable the necessary permissions and run it from your terminal.

### Option 2: Clone the Repository

To install and run Renameador, ensure you have [Node.js](https://nodejs.org/) installed. Follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/PabloGomezBr/renameador.git
    ```
2. Navigate to the project directory:
    ```sh
    cd renameador
    ```
3. Install the dependencies:
    ```sh
    npm install
    ```

---

## 🚀 Usage

1. Run the tool:
    ```sh
    node renameador.js
    ```
2. Follow the on-screen instructions to:
    - Add exceptions
    - Choose whether to include directories
    - Select the renaming option (start or end)
    - Enter the number of characters to delete

### CLI Options

- **Exceptions**: Specify files or directories to exclude from renaming.
- **Include Directories**: Option to include directories in the renaming process.
- **Remove Characters**: Choose to remove characters from the start or end of filenames.

---

## 📝 Examples

### Removing Characters from the Start

If you want to remove the first 3 characters from filenames:

1. Choose option `1: Remove characters from the start of the item`.
2. Enter the number `3`.

### Removing Characters from the End

If you want to remove the last 2 characters from filenames:

1. Choose option `2: Remove characters from the end of the item`.
2. Enter the number `2`.

### Handling Conflicts

The tool will alert you if there are conflicts (e.g., same names, empty names). You can choose to:

1. Skip conflicting items.
2. Rename them anyway.
3. Abort the operation.

---

## 🤝 Contributing

We welcome contributions! Follow these steps to contribute:

1. Fork the repository.
2. Create a new branch:
    ```sh
    git checkout -b feature-branch
    ```
3. Make your changes and commit them:
    ```sh
    git commit -m "Description of your changes"
    ```
4. Push to the branch:
    ```sh
    git push origin feature-branch
    ```
5. Open a Pull Request on GitHub.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

## 👨‍💻 Author

**Pablo Gómez Bravo**  
GitHub: [PabloGomezBr](https://github.com/PabloGomezBr)

<!-- ![Author Signature](path/to/signature.png) -->

---

Feel free to reach out if you have any questions or need further assistance! Happy renaming! 🎉
