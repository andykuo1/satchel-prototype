export default `
<fieldset class="container">
  <legend>Foundry</legend>

  <!-- Content Elements -->
  <inventory-grid init="socket" id="socketInventory"></inventory-grid>

  <!-- UI Elements -->
  <fieldset id="fieldsetSize" disabled>
    <legend>Size</legend>
    <div class="labels">
      <span class="toggle">
        <input type="radio" name="sizeIndex" id="itemSize1" value=1 tabindex=-1>
        <label for="itemSize1" title="Small" tabindex=0>
          <img src="res/spoke.svg">
        </label>
      </span>
      <span class="toggle">
        <input type="radio" name="sizeIndex" id="itemSize2" value=2 checked tabindex=-1>
        <label for="itemSize2" title="Medium" tabindex=0>
          <img src="res/onehand.svg">
        </label>
      </span>
      <span class="toggle">
        <input type="radio" name="sizeIndex" id="itemSize3" value=3 tabindex=-1>
        <label for="itemSize3" title="Large" tabindex=0>
          <img src="res/twohand.svg">
        </label>
      </span>
    </div>
    <input type="number" name="width" id="itemWidth" hidden value=2>
    <input type="number" name="height" id="itemHeight" hidden value=2>
  </fieldset>

  <output id="outputSize" disabled>
    <span id="outputSizeWidth">2</span>
    <span>⨯</span>
    <span id="outputSizeHeight">2</span>
  </output>

  <fieldset id="fieldsetShape" disabled>
    <legend>Shape</legend>
    <div class="labels">
      <span class="toggle">
        <input type="checkbox" name="stackable" id="itemStackable" tabindex=-1>
        <label for="itemStackable" tabindex=0>
          <img src="res/grain.svg" title="Stackable" alt="Stackable">
        </label>
      </span>
      <span class="toggle">
        <input type="checkbox" name="long" id="itemLong" tabindex=-1>
        <label for="itemLong" tabindex=0>
          <img src="res/height.svg" title="Long" alt="Long">
        </label>
      </span>
      <span class="toggle">
        <input type="checkbox" name="flat" id="itemFlat" tabindex=-1>
        <label for="itemFlat" tabindex=0>
          <img src="res/flatten.svg" title="Flat" alt="Flat">
        </label>
      </span>
      <span class="toggle">
        <input type="checkbox" name="heavy" id="itemHeavy" tabindex=-1>
        <label for="itemHeavy" tabindex=0>
          <img src="res/scale.svg" title="Heavy" alt="Heavy">
        </label>
      </span>
    </div>
  </fieldset>

  <fieldset id="fieldsetStyle" disabled>
    <legend>Style</legend>
    <input type="url" name="imageSrc" id="itemImage">
    <label>
      <img src="res/image.svg" title="image">
    </label>
  </fieldset>
  
  <button id="newItem">
    <img src="res/add.svg" title="New" alt="New">
  </button>

  <input name="invId" id="itemInvId" hidden>
  <input name="itemId" id="itemItemId" hidden>
</fieldset>
`;
