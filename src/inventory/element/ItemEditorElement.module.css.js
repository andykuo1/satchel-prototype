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
  padding-bottom: 2em;
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

#fieldsetStyle {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border: none;
  padding: 0;
}
#fieldsetStyle > legend {
  display: none;
}
#fieldsetStyle input {
  width: 30%;
  vertical-align: top;
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
`;
