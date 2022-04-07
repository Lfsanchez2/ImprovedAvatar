/***********************************************************************************
  Avatar Classes

  Uses the p5.play library with Avatar and other classes

  This class is a TEMPLATE for you to modify in your other code.

  Avatar Class:
    - will automatically mirror when you change the speed of the avatar
    - you can change the speed of the avatar
    - set positions for each one
    - do collision-detection
  
------------------------------------------------------------------------------------
	To use:
	Add this line to the index.html

  <script src="p5.avatar.js"></script>
***********************************************************************************/

// Animated character
class Avatar  {
  // gets called with new keyword
  constructor(name, x, y) {
    this.name = name;
    this.sprite = createSprite(x, y);
    
    this.maxSpeed = 6;
    this.hasStandingAnimation = false;
    this.hasMovingAnimation = false;

    // no grabables
    this.grabbable = undefined;

    // make avatar still
    this.setSpeed(0,0);
  }

   // adds a moving animation (optional)
   addMovingAnimation(startPNGPath, endPNGPath) {
    this.sprite.addAnimation('walking', startPNGPath, endPNGPath);
    this.hasMovingAnimation = true;
    this.currentAnimation = 'walking';
  }

  // adds a standing animation (optional)
  addStandingAnimation(startPNGPath, endPNGPath) {
    this.sprite.addAnimation('standing', startPNGPath, endPNGPath);
    this.hasStandingAnimation = true;
  }

  setPosition(x,y) {
    this.sprite.position.x = x;
    this.sprite.position.y = y;
  }

  // store max speed in a class variable, so that we never go past this number
  setMaxSpeed(num) {
    this.maxSpeed = num;
  }

  // return name of current grabble, empty string if none
  getGrabbableName() {
    if( this.grabbable === undefined ) {
      return "";
    }
    else {
      return this.grabbable.name;
    }
  }

  // set current speed, flip sprite, constain to max, change animations
  setSpeed(xSpeed,ySpeed) {
    // flip sprite depending on direction
    if( xSpeed > 0 ) {
      this.sprite.mirrorX(-1);
    }
    else {
      this.sprite.mirrorX(1);
    }

    if( this.hasStandingAnimation ) {
      this.sprite.changeAnimation('standing');
    }

    // may need to optimize this
    if( xSpeed === 0 && ySpeed === 0 && this.hasStandingAnimation ) {
      this.sprite.changeAnimation('standing');
    }
    else if( this.hasMovingAnimation ) {
      this.sprite.changeAnimation('walking');
    }
    
    // set to xSpeed and constrain to max speed
    this.sprite.velocity.x = constrain(xSpeed, -this.maxSpeed, this.maxSpeed );
    this.sprite.velocity.y = constrain(ySpeed, -this.maxSpeed, this.maxSpeed );
  }

  // a sprite (or avatar to check overlap with)
  overlap(overlapSprite, callback) {
    if( overlapSprite === undefined ) {
      console.log("early return");
      return;
    }

   this.overlap(overlapSprite.sprite, callback );
  }

  // accessor function to give avatar a grabbable
  clearGrabbable() {
    this.grabbable = undefined;
  }

  // accessor function to give avatar a grabbable
  setGrabbable(grabbable) {
    this.grabbable = grabbable;
  }

  // if avatar has a grabble, update the position of that grabbable
  // call every draw loop
  update() {
    if( this.grabbable !== undefined ) {
      this.grabbable.sprite.position.x = this.sprite.position.x + 10;
      this.grabbable.sprite.position.y = this.sprite.position.y + 10;
    }
  }

  // draws the name, an optional feature
  drawLabel() {
    textSize(12);
    fill(240);
    text(this.name, this.sprite.position.x + 20, this.sprite.position.y + 10 );
  }
}

// 2D sprite which we will be able to pick up and dropp
class StaticSprite {
  // call upon preload() of p5.js to acutally load the image
  constructor(name, x, y, pngPath) {
    this.name = name;
    this.img = loadImage(pngPath);
    this.sprite = createSprite(x, y);
  }

  setup() {
    this.sprite.addImage('static', this.img );
  }
}

/*
  NPC Class - By Luis
  This is a custom NPC class that extends the current Avatar class. An NPC will be able
  to have conversations with the player, who will be prompted to press a key in order
  to start a dialogue. Dialogue is progressed by pressing the same button while overlapping
  the NPC sprite. If a player steps away from an NPC, the dialogue will disappear.

  This is a modification of my NPC class to better fit this Avatar class. The code is pretty 
  much the same, just with the addition of a simple quest feature you can assign to NPCs. 
  It is also possible to make fancier message boxes for the NPC dialogue, in this example they
  just pop up above the NPC. You can display the messages in an HTML div element that can have
  better styling than p5 through CSS. You can see an example of this in my Project 2 Repo.
*/

class NPC extends Avatar {
  constructor(name, x, y, pngPath) {
    super(name, x, y);
    this.interactionsArray = [];
    this.interactionIndex = 0;
    this.isActive = false;
    this.displayMessage = 'Press \'e\' to interact!'
    if(pngPath != null) {
      this.img = loadImage(pngPath);
    }
    //Quest related instance variables
    this.hasQuest = false;
    this.questItem = null;
    this.questFinished = false;
    this.questSuccess = null;
    this.questFailure = null;
  }

  // Same as StaticSprite class, to support static NPCs
  setup() {
    this.sprite.addImage('static', this.img );
    console.log(this.sprite);
  }

  // Initializes the parameters for a Quest NPC from given parameters.
  setupQuest(questItem, questSuccessMsg, questFailureMsg) {
    this.questItem = questItem;
    this.questSuccess = questSuccessMsg;
    this.questFailure = questFailureMsg;
    this.questStarted = true;
    this.hasQuest = true;
  }

  // Adds multiple interactions for an NPC that are stored in a CSV file. The given parameter
  // should be a CSV filepath. If the given CSV does not follow the expected column format, nothing
  // will be added to the NPC's interactions. This function will only accept String parameters.
  addInteraction(interactionCSV) {
    let interactionTable = interactionCSV.loadTable();
    if(interactionTable.getColumn('index') && interactionTable.getColumn('interaction')) {
      for(let i = 0; i < interactionTable.getRowCount(); i++) {
        this.interactionsArray.push(table.getString(i, 1));
      }  
    }
  }

  // Adds a single interaction to the array, should be a string parameter.
  addSingleInteraction(interaction) {
    this.interactionsArray.push(interaction);
  }

  displayInteractPrompt(target) {
    // Only displays the interact prompt or current dialogue of the NPC when the player 
    // avatar is overlapping the NPC sprite.
    if(target.sprite.overlap(this.sprite)) {
      fill('white');
      textSize(12);
      textAlign(CENTER);
      text(this.displayMessage, this.sprite.position.x, this.sprite.position.y - 70);
      // This is the 'e' key, but you can change it to any key you'd prefer. Just make sure 
      // you also update that key in the keyPressed function in sketch.js!
      if(keyCode === 69) {
        // This variable is to ensure that only one NPC is active at a time. Without this,
        // having multiple NPCs on a single screen may cause some bugs in the progression of
        // their individual dialogue.
        this.isActive = true;
        // Keeps an NPC from moving when they're being interacted with. Haven't tested yet, but
        // the idea is to be able to have NPCs that walk around on a set path. If you interact 
        // with an NPC during its cycle, it'll pause. Still thinking about how to continue the 
        // cycle afterwards.
        this.setSpeed(0,0);
        // Check's if this NPC is a Quest NPC, if their quest has been completed, and if the
        // player avatar is holding a grabbable.
        if(this.hasQuest && !this.questFinished && target.getGrabbableName() != "") {
          // If the player has the valid quest item, display the success message and end the quest.
          if(target.getGrabbableName() === this.questItem) {
            this.displayMessage = this.questSuccess;
            this.questFinished = true;
          }
          // If the player does not have the valid quest item, display the failure message and keep
          // the quest going.
          else {
            this.displayMessage = this.questFailure;
          }
        }
        // If the player has completed the quest, default to the success message for all future interactions.
        else if (this.questFinished) {
          this.displayMessage = this.questSuccess;
        }
        // If the player has no grabbable and has not completed the quest OR this NPC is not a Quest NPC, 
        // display the current message in the interaction array.
        else {
          this.displayMessage = this.interactionsArray[this.interactionIndex];
        }
      }
    }
    else {
      this.displayMessage = 'Press \'e\' to interact!';
      this.isActive = false;
      // Display a message above an NPC that has a quest, the visual isn't final, just 
      // something to attract the player's attention for now.
      if(!this.questFinished && this.hasQuest) {
        fill('red');
        textSize(20);
        textAlign(CENTER);
        text('I have a quest!', this.sprite.position.x, 
        this.sprite.position.y - this.sprite.height/2 - 25);
      }
    }  
  }

  // Continues the conversation with an NPC through the interaction array. Quest dialogue 
  // is separately stored in the questSuccess and questFailure variables, so the relevant
  // quest dialogue will appear without worry of this function overwriting it.
  continueInteraction() {
    if(this.isActive) {
      if(this.interactionIndex < this.interactionsArray.length-1) {
        this.interactionIndex++;
      }
    }
  }

  // Check for player avatar overlapping an NPC sprite and if that NPC and if that NPC 
  // is the current active NPC (only 1 at a time);
  isInteracting(target) {
    return target.sprite.overlap(this.sprite) && this.isActive;
  }
}