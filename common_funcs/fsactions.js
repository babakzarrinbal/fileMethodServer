const exp = {};
const fs = require("fs");
const path = require("path");

/**
 * listing methods base on filepath/method
 * @param {string} filePath path of js file
 * @param {string} url prefix to add to method 
 */
exp.getFileMethods = function getFileMethods(filePath, url) {
  try {
    let methods = require(path.resolve(filePath));
    if (typeof methods != "object") return null;
    let functionNames = Object.keys(methods);
    if (!functionNames.length) return null;
    return functionNames.reduce((cu, name) => {
      return[
        ...cu,
        {
          path: path.join(url||"", name).replace(/\\/g,"/"),
          name,
          method: methods[name],
        },
      ];
    },[]);
  } catch (e) {
    console.log(e);
    return null;
  }
};

/**
 * listing files with given address
 * @param {string} folderpath main folder path
 * @param {object} options options for listing methods
 * @param {boolean} options.format array or comma seperated string of acceptable file formats
 * @param {RegExp} options.ignore regexpression to ignore file and folders defult=> ^(_|\.)
 * @param {RegExp} options.accept regexpression to accept file and folders defult=>null (all)
 * @param {boolean} options.recursive to list subfolders also default=>true
 */
exp.listFiles = function listFiles(folderpath, options = {}) {
  folderpath = path.resolve(folderpath).replace(/\\/g, "/");
  let rfiles = internalwalk(folderpath, options);
  rfiles.forEach((f) => (f.relativePath = f.fullPath.replace(folderpath, "")));
  return rfiles;
};

/**
 * listing files with given address
 * @param {string} folderpath main folder path
 * @param {object} options options for listing methods
 * @param {boolean} options.format array or comma seperated string of acceptable file formats
 * @param {RegExp} options.ignore regexpression to ignore file and folders defult=> ^(_|\.)
 * @param {RegExp} options.accept regexpression to accept file and folders defult=>null (all)
 * @param {boolean} options.recursive to list subfolders also default=>true
 */
let internalwalk = function internalwalk(folderpath, options) {
  options.ignore = options.ignore || /^(_|\.)/;
  options.recursive = options.recursive != undefined ? options.recursive : true;
  if (options.format)
    options.format = Array.isArray(options.format)
      ? options.format
      : options.format.split(",");

  let resultFiles = [];
  let files = fs.readdirSync(folderpath);
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    if (
      file.match(options.ignore) ||
      (options.accept && !file.match(options.ignore))
    )
      continue;
    let address = path.resolve(folderpath, file);
    if (!fs.statSync(address).isDirectory()) {
      let name = file.split(".");
      format = name.length > 1 ? name.pop() : "";
      if (options.format && !options.format.includes(format)) continue;
      let fullPath = address.replace(/\\/g, "/");
      let directory = fullPath.includes("/")
        ? fullPath.slice(0, fullPath.lastIndexOf("/") + 1)
        : "";
      resultFiles.push({
        name: name.join("."),
        format,
        fileName: file,
        directory,
        fullPath,
      });
    } else if (options.recursive) {
      resultFiles.push(...internalwalk(address, options));
    }
  }
  return resultFiles;
};

module.exports = exp;
