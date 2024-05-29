const fs = require('fs');
const readline = require('readline');
const path = require('path');
const figlet = require('figlet');

/**
 * Class used to print the respective conflict messages
 */
class Conflicts {
    static SAME_NAME = 'SAME_NAME';
    static LENGTH_0 = 'LENGTH_0';
    static ONLY_EXTENSION = 'ONLY_EXTENSION';
    static NO_CONFLICT = 'NO_CONFLICT';

    constructor() {}

    static returnConflictMsg(conflictType) {
        switch(true) {
            case conflictType === this.SAME_NAME:
                return 'The new item shares its name with another item in the current directory.';
            case conflictType === this.LENGTH_0:
                return 'The new item name will be erased entirely (it may be deleted)';
            case conflictType === this.ONLY_EXTENSION:
                return 'The new item name will only have its extension';
            default:
                return 'Everything OK';
        }
    }

    toString() {
        return JSON.stringify(this);
    }
}

/**
 * Scans the directory and retrieves items to rename based on user exceptions.
 * Also asks the user if they want to include folders in the process (if there are any).
 *
 * @param {Object} rlInterface - The readline interface for prompting user input.
 * @param {Array} exceptions - List of items to exclude from renaming.
 * @returns {Object} - An object containing the filtered arrays of files and directories to rename.
 */
async function getItemsToRename(rlInterface, exceptions) {

    // Scan the files filtering the current program and the exceptions the user added
    const entries = fs
    .readdirSync('./')
    .filter((entry) => {
        // TODO: Modify the exclusions only for dev purposes or if you are executing from node
        const isExcluded = [
            path.basename(__filename),
            path.basename('node_modules'),
            path.basename('package-lock.json'),
            path.basename('package.json'),
            path.basename('.git'),
            path.basename('LICENSE'),
            path.basename('README.md'),
            path.basename('.gitignore')
        ];
        if (process.argv[0] !== undefined) {
            isExcluded.push(path.basename(process.argv[0]));
        }
        return !isExcluded.includes(entry) && !exceptions.includes(entry);
    });

    let files = [];
    let directories = [];

    for (const entry of entries) {
        const stats = fs.statSync(entry);
        if (stats.isDirectory()) {
            directories.push(entry);
        } else {
            files.push(entry);
        }
    }

    let includeDirsAnswer = '';
    if(directories.length > 0) {
        while (!['y', 'n', 'q'].includes(includeDirsAnswer)) {
            includeDirsAnswer = await new Promise((resolve) => {
                rlInterface.question(
                    `\x1b[33m\u26A0  There are directories/folders in the current directory  \u26A0\nDo you want to include them in the renaming process? (y/n): \x1b[0m`,
                    (response) => {
                        resolve(response.trim().toLowerCase());
                    }
                );
            });
    
            if (!['y', 'n', 'q'].includes(includeDirsAnswer)) {
                console.log('\n\x1b[31m\u274c  Invalid option selected. Tipe [ q ] if you want to exit program  \u274c\x1b[0m\n');
            }
        }

        // If user wants to leave just return empty arrays and program will exit
        if (includeDirsAnswer === 'q') {
            return {files: [], directories: []};
        }

        if (includeDirsAnswer === 'n') {
            return {files: [...files], directories: []}
        }
    }
    return {files: [...files], directories: [...directories]}
}

/**
 * Previews the renaming of files and directories
 * 
 * @param {*} charsToDelete - Number of characters to delete.
 * @param {*} files - List of files to be renamed.
 * @param {*} directories - List of directories to be renamed.
 * @param {*} isFromEnd - Flag indicating whether characters should be removed from the end of the filenames.
 * @param {*} isDirsIncluded - Flag indicating whether directories should be included in the renaming process.
 * @param {*} numItemsToDisplay - Number of items to display in the preview.
 */
function renamingPreview(charsToDelete, files, directories, isFromEnd, isDirsIncluded, numItemsToDisplay) {
    // Group all items to display them together
    const itemsToRename = [...files, ...directories];

    console.log('\n\x1b[36m╔══════════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log(`\x1b[36m║       The ${isDirsIncluded ? 'items' : 'files'} will be renamed as follows                       ║\x1b[0m`);
    console.log('\x1b[36m╠══════════════════════════════════════════════════════════════════╣\x1b[0m');
    console.log(`\x1b[36m║\x1b[0m`);
    itemsToRename.slice(0, numItemsToDisplay).forEach((prevItemName, index) => {
        const newItemName = isFromEnd
            ? removeCharsFromEnd(prevItemName, charsToDelete)
            : removeCharsFromStart(prevItemName, charsToDelete);
        console.log(`\x1b[36m║  Current:      \x1b[0m${prevItemName}`);
        console.log(`\x1b[36m║  New:          \x1b[0m${newItemName}`);
        if (isDirsIncluded) {
            if (directories.includes(prevItemName)) {
                console.log('\x1b[36m║  Type:         \x1b[0mFolder');
            } else {
                console.log('\x1b[36m║  Type:         \x1b[0mFile');
            }
        }
        if (index < numItemsToDisplay - 1 && index !== itemsToRename.length - 1) {
            console.log(`\x1b[36m║··································································║\x1b[0m`);
        }
    });

    if (itemsToRename.length > numItemsToDisplay) {
        console.log(`\x1b[36m║\x1b[0m`);
        console.log(
            `\x1b[36m║\x1b[0m\x1b[33m \u{1F6C8} There are a total of ${itemsToRename.length} ${isDirsIncluded ? 'items' : 'files'}. ${
                itemsToRename.length - numItemsToDisplay
            } remaining to be displayed\x1b[0m`
        );
    }
    console.log('\x1b[36m╚══════════════════════════════════════════════════════════════════╝\x1b[0m');

}

/**
 * Renames files and directories based on user input.
 *
 * @param {Object} rlInterface - The readline interface for prompting user input.
 * @param {number} charsToDelete - Number of characters to delete.
 * @param {boolean} isFromEnd - Flag indicating if characters should be removed from the end.
 */
async function renameFiles(rlInterface, files, directories, charsToDelete, isFromEnd, isDirsIncluded) {
    try {
        // Check for conflicts
        const conflictItemsArr = [];
        let conflictType = Conflicts.NO_CONFLICT;

        for (const file of files) {
            const newFileName = isFromEnd
                ? removeCharsFromEnd(file, charsToDelete)
                : removeCharsFromStart(file, charsToDelete);

            switch(true) {
                case newFileName === file:
                    conflictType = Conflicts.SAME_NAME;
                break;
                case newFileName.length <= 0:
                    conflictType = Conflicts.LENGTH_0;
                    break;
                case newFileName.startsWith('.') || newFileName.endsWith('.'):
                    if (path.extname(newFileName).length === 0 || path.extname(newFileName) === newFileName) {
                        conflictType = Conflicts.ONLY_EXTENSION;
                    } else {
                        // Item name starts/ends with '.', but it is not its extension so it won't cause conflict
                        conflictType = Conflicts.NO_CONFLICT;
                    }
                    break;
                default:
                    conflictType = Conflicts.NO_CONFLICT;
            }
            
            if (conflictType !== Conflicts.NO_CONFLICT) {
                conflictItemsArr.push({ current: file, new: newFileName, conflictType });
            }
        }

        if (isDirsIncluded) {
            for (const dir of directories) {
                const newDirName = isFromEnd
                    ? removeCharsFromEnd(dir, charsToDelete)
                    : removeCharsFromStart(dir, charsToDelete);
                
                switch(true) {
                    case newDirName === dir:
                        conflictType = Conflicts.SAME_NAME;
                    break;
                    case newDirName.length <= 0:
                        conflictType = Conflicts.LENGTH_0;
                        break;
                    default:
                        conflictType = Conflicts.NO_CONFLICT;
                }
                
                if (conflictType !== Conflicts.NO_CONFLICT) {
                    conflictItemsArr.push({ current: dir, new: newDirName, conflictType });
                }
            }
        }

        if (conflictItemsArr.length > 0) {
            console.log(`\x1b[31m╔═════════════════════════════════════════════════════════════════════════════════════════╗\x1b[0m`);
            console.log(`\x1b[31m║        ${conflictItemsArr.length > 1 ? 'Conflicts' : 'Conflict'} Detected                                                                ║\x1b[0m`);
            console.log(`\x1b[31m╠═════════════════════════════════════════════════════════════════════════════════════════╣\x1b[0m`);
            conflictItemsArr.forEach(({ current, new: newName, conflictType }, index) => {
                console.log(`\x1b[31m║  Current:      \x1b[0m${current}`);
                console.log(`\x1b[31m║  New:          \x1b[0m${newName}`);
                console.log(`\x1b[31m║  Description:  \x1b[0m${Conflicts.returnConflictMsg(conflictType)}`);
                if (index < conflictItemsArr.length - 1) {
                    console.log(`\x1b[31m║·························································································║\x1b[0m`);
                }
            });
            console.log(`\x1b[31m╚═════════════════════════════════════════════════════════════════════════════════════════╝\x1b[0m`);
            console.log(`\n\x1b[31m\u26A0  Renaming conflicting items may cause errors and may result in data loss  \u26A0\x1b[0m\n`);

            let conflictOption = '';
            while (!['1', '2', '3'].includes(conflictOption)) {
                conflictOption = await new Promise((resolve) => {
                    console.log("\x1b[36mPlease select an option:\x1b[0m");
                    console.log("\x1b[36m\t1: Skip conflicting " + (isDirsIncluded ? "items" : "files"));
                    console.log("\x1b[36m\t2: Rename conflictive " + (isDirsIncluded ? "items" : "files") + " anyway");
                    console.log("\x1b[36m\t3: Abort\x1b[0m");
                    rlInterface.question("Your choice: ", (response) => {
                        resolve(response.trim().toLowerCase());
                    });
                });
        
                if (!['1', '2', '3'].includes(conflictOption)) {
                    console.log('\n\x1b[31m\u274c  Invalid option selected  \u274c\x1b[0m\n');
                }
            }
            
            if(conflictOption === '3') {
                console.log('Operation canceled by user');
                return;
            }

            // Filter/Skip the conflicts
            if(conflictOption === '1') {
                files = files.filter(
                    (file) =>
                        !conflictItemsArr.some((conflict) => conflict.current === file)
                );
                if (isDirsIncluded) {
                    directories = directories.filter(
                        (dir) =>
                            !conflictItemsArr.some(
                                (conflict) => conflict.current === dir
                            )
                    );
                }
            }
        } else {  
            const lastConfirmationToRename = await new Promise((resolve) => {
                rlInterface.question(
                    'Do you want to continue and rename the files? (y/n): ',
                    (response) => {
                        resolve(response.trim().toLowerCase());
                    }
                );
            });

            if (lastConfirmationToRename === 'n') {
                console.log('\nOperation canceled by user.');
                return;
            }
        }

        // Rename files and directories (if included)
        let filesModified = 0;

        for (const file of files) {
            const newFileName = isFromEnd
                ? removeCharsFromEnd(file, charsToDelete)
                : removeCharsFromStart(file, charsToDelete);
            fs.renameSync(file, newFileName);
            filesModified++;
        }

        if (isDirsIncluded) {
            for (const dir of directories) {
                const newDirName = isFromEnd
                    ? removeCharsFromEnd(dir, charsToDelete)
                    : removeCharsFromStart(dir, charsToDelete);
                fs.renameSync(dir, newDirName);
                filesModified++;
            }
        }
        ey = 0;
        console.log('\n\x1b[32m\u2714  Operation completed successfully');
        console.log(`\u2714  ${filesModified} items have been successfully renamed\x1b[0m`);
    } catch (error) {
        throw new Error(error);
    }
}

// TODO: UNIFICAR FUNCIONES EN UNA
/**
 * Removes specified number of characters from the start of the file name.
 *
 * @param {string} fileName - The original file name.
 * @param {number} charsToDelete - Number of characters to delete.
 * @returns {string} - The new file name.
 */
function removeCharsFromStart(fileName, charsToDelete) {
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const newBaseName = baseName.substring(charsToDelete);
    return newBaseName + ext;
}

/**
 * Removes specified number of characters from the end of the file name.
 *
 * @param {string} fileName - The original file name.
 * @param {number} charsToDelete - Number of characters to delete.
 * @returns {string} - The new file name.
 */
function removeCharsFromEnd(fileName, charsToDelete) {
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const newBaseName = baseName.slice(0, -charsToDelete);
    return newBaseName + ext;
}

async function main () {
    const rlInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    try {
        console.log("\x1b[34m╔══════════════════════════════════════════════════╗");
        console.log("║                                                  ║");
        console.log("║       Welcome to the Tiniest Renaming Tool       ║");
        console.log("║                                                  ║");
        console.log("║              ╭────────────────────╮              ║");
        console.log("║              |                    |              ║");
        console.log("║              |     RENAMEADOR     |              ║");
        console.log("║              |                    |              ║");
        console.log("║              ╰────────────────────╯              ║");
        console.log("║                                                  ║");
        console.log("║      A simple yet powerful tool for renaming     ║");
        console.log("║      your files and directories with ease!       ║");
        console.log("║                                                  ║");
        console.log("╚══════════════════════════════════════════════════╝\x1b[0m\n\n");

        console.log('First things first!');
        console.log("¿Would you like to add any exception to the process?\n");
        console.log("\x1b[36mIf so, please type the full file/folder name and press ENTER to proceed with the next item.\x1b[0m");
        console.log("\x1b[36mTo finish, just leave it blank and press ENTER.\x1b[0m");

        const exceptions = [];
        while (true) {
            const response = await new Promise((resolve) => {
                rlInterface.question("Item full name: ", (input) => {
                    resolve(input.trim());
                });
            });
            if (response === '') {
                break;
            } else {
                exceptions.push(response);
            }
        }
        console.log(`\x1b[32m\u2714  ${exceptions.length > 0 ? `${exceptions.length} exceptions have been added` : 'No exceptions added'} \x1b[0m\n`);

        // getItemsToRename is returning the files and directories already filtered (directories will be empty if user didnt want to include them)
        const {files, directories} = await getItemsToRename(rlInterface, exceptions);
        const isDirsIncluded = directories.length > 0;

        // If there is no files to rename, abort
        if (files.length <= 0 && directories.length <= 0) {
            console.log('\n\u2692  Ops... seems there is nothing to rename here...');
            console.log('\u2692  If it is an error please report it to the developer!');
            return;
        }


        let mainOption = '';
        while (!['1', '2', 'q'].includes(mainOption)) {
            mainOption = await new Promise((resolve) => {
                console.log("\n\x1b[36mNow, please select an option to continue:\x1b[0m");
                console.log("\x1b[36m\t1: Remove characters from the start of the item");
                console.log("\x1b[36m\t2: Remove characters from the end of the item\x1b[0m");
                rlInterface.question("Your choice: ", (response) => {
                    resolve(response.trim().toLowerCase());
                });
            });  
    
            if (!['1', '2', 'q'].includes(mainOption)) {
                console.log('\n\x1b[31m\u274c  Invalid option selected. Tipe [ q ] if you want to exit program  \u274c\x1b[0m\n');
            }
        }

        if(mainOption === 'q') {
            console.log('Operation canceled by user');
            return;
        }

        const isFromEnd = mainOption === '2';

        const charsToDelete = await new Promise((resolve) => {
            rlInterface.question(
                'Enter the number of characters to delete: ',
                (response) => {
                    resolve(Number(response));
                }
            );
        });

        if (isNaN(charsToDelete) || charsToDelete <= 0) {
            throw new Error('Invalid number of characters to delete.');
        }
        
        renamingPreview(charsToDelete, files, directories, isFromEnd, isDirsIncluded, 10);
        await renameFiles(rlInterface, files, directories, charsToDelete, isFromEnd, isDirsIncluded);
    } catch (error) {
        console.error('\n\n\x1b[31m\u{1F480}  An error occurred:\x1b[0m', error);
        console.error('\n\x1b[31m\u{1F480}  Error message:\x1b[0m', error.message);
        return;
    } finally {
        rlInterface.close();
    }
}

/**
 * Executes the main function asynchronously and displays the signature.
 */
(async () => {
    await main();

    // Signature
    figlet.text('Pablo Gómez Bravo', {
        font: 'Big',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    }, function(err, data) {
        if (err) {
            console.log('Error:', err);
            return;
        }
        console.log(`\n\n\n\x1b[34m${data}\x1b[0m`);
        console.log('\x1b[34m\t\t\u{1f310}   https://github.com/PabloGomezBr/renameador   \u{1f310}\x1b[0m\n\n')
        
        console.log("\n\n\n\nPress any key to exit...");
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', process.exit.bind(process, 0));
    });
})();
