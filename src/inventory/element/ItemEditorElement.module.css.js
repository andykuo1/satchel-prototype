export default `
:host {
  display: block;
}
.container {
  position: relative;
}
input {
  font-family: monospace;
}

#fieldsetSocket {
  position: relative;
}

#fieldsetSize {
  position: absolute;
  top: 0;
  left: 0;
  border: none;
  padding: 0;
}
#fieldsetSize > legend {
  display: none;
}
#outputSize {
  position: absolute;
  left: 0.5em;
  bottom: 0;
}

#fieldsetShape {
  position: absolute;
  top: 0;
  right: 0.25em;
  border: none;
  padding: 0;
}
#fieldsetShape > legend {
  display: none;
}

#newItem {
  position: absolute;
  bottom: 0;
  right: 0.25em;
  padding: 0;
  background: none;
  border: none;
}

fieldset {
  display: block;
  text-align: center;
}
fieldset:disabled {
  visibility: hidden;
}
output[disabled] {
  visibility: hidden;
}

.labels {
  display: flex;
  text-align: center;
}
.labels > * {
  flex: 1;
}

.toggle {
  margin-bottom: 0.2em;
}
.toggle > input {
  margin: 0;
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle > label {
  opacity: 0.3;
  border-bottom: 0.2em solid transparent;
}
.toggle > input:checked + label {
  opacity: 1;
  border-color: white;
}

.stackName {
  color: black;
  background-color: white;
}
.stackName input[type="text"] {
  background: none;
  border: none;
}
.stackName input[type="number"] {
  width: 2.5em;
  background: none;
  border: none;
}
.hidden {
  opacity: 0;
}

.stackDesc {
  display: flex;
  height: 8em;
}
.stackDesc > textarea {
  flex: 1;
  resize: none;
  border: none;
}
`;
