/**
 * @param {string|Array<string>} [acceptFileTypes]
 * @param {boolean} [multiple]
 * @returns {Promise<FileList>}
 */
export async function uploadFile(acceptFileTypes = undefined, multiple = false) {
  let input = document.createElement('input');
  input.type = 'file';
  if (typeof acceptFileTypes !== 'undefined') {
    input.accept = Array.isArray(acceptFileTypes) ? acceptFileTypes.join(',') : acceptFileTypes;
  }
  input.toggleAttribute('multiple', multiple);
  input.toggleAttribute('hidden');
  return new Promise((resolve, reject) => {
    const uploadChangeCallback = (e) => {
      input.removeEventListener('change', uploadChangeCallback);
      const files = input.files;
      resolve(files);
    };
    input.addEventListener('change', uploadChangeCallback);
    try {
      document.head.appendChild(input);
      input.click();
    } catch (e) {
      reject(e);
    } finally {
      document.head.removeChild(input);
    }
  });
}

export async function uploadImageFile(multiple = undefined) {
  return await uploadFile(['image/*'], multiple);
}

export async function uploadJSONFile(multiple = undefined) {
  return await uploadFile(['.json'], multiple);
}
