const STACK_SIZE_PATTERN = /(.*)\s+x([0-9]+)\s*$/;
export function parseTextToItem(text) {
  let titleStartIndex = text.indexOf('#');
  if (titleStartIndex >= 0) {
    let titleEndIndex = text.indexOf('\n');
    if (titleEndIndex < 0) {
      titleEndIndex = text.length;
    }
    let fullTitle = text.substring(titleStartIndex + 1, titleEndIndex);
    let stackSize;
    try {
      let [
        // eslint-disable-next-line no-unused-vars
        _,
        displayNameText,
        stackSizeText,
      ] = STACK_SIZE_PATTERN.exec(fullTitle);
      stackSize = Number.parseInt(stackSizeText);
      fullTitle = displayNameText;
    } catch (e) {
      stackSize = -1;
    }
    return {
      stackSize,
      displayName: fullTitle.trim(),
      description: text.substring(titleEndIndex + 1),
    };
  } else {
    return {
      stackSize: -1,
      displayName: '',
      description: text,
    };
  }
}

export function parseItemToText(item) {
  let content = '';
  const title = item.displayName;
  const stackSize = item.stackSize;
  const description = item.description;
  if (title || stackSize >= 0) {
    content += '#';
    if (title) {
      content += ` ${title}`;
    }
    if (stackSize >= 0) {
      content += ` x${stackSize}`;
    }
  }
  if (description) {
    content += `\n${description}`;
  }
  return content;
}
