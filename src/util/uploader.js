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
    let uploaded = false;
    input.addEventListener(
      'change',
      (e) => {
        if (uploaded) {
          // Already uploaded. Try resetting.
          input.value = '';
          return;
        }
        uploaded = true;
        const files = input.files;
        resolve(files);
      },
      { once: true }
    );
    window.addEventListener(
      'mouseup',
      (e) => {
        if (uploaded || input.files.length > 0) {
          // Success! It was fine!
          input.value = '';
          return;
        }
        reject(new Error('Maybe file dialog cancelled?'));
      },
      { once: true, capture: true }
    );
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
