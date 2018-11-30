// walker has fixed shapes and structures
// shape definitions are in the constructor


function deg2rad(deg) { 
  return deg/180*Math.PI
}

const STRENGTH = 3

var Walker = function() {
  this.__constructor.apply(this, arguments);
}


Walker.prototype.__constructor = function(world) {
  this.world = globals.world;

  this.density = 106.2; // common for all fixtures, no reason to be too specific

  this.max_distance = -5;
  this.health = 10 //config.walker_health;
  this.score = 0;
  this.low_foot_height = 0;
  this.head_height = 0;
  this.steps = 0;
  this.distance = 0 
  this.last_left_left_forward = true

  this.hue = Math.randf(200,360)

  this.bd = new b2.BodyDef({positions: {x:10, y:-10}});
  this.bd.position.x += Math.randf(-10, 10)
  this.bd.type = b2.Body.b2_dynamicBody;
  this.bd.linearDamping = 0;
  this.bd.angularDamping = 20; // decay in force/ air friction
  this.bd.allowSleep = true;
  this.bd.awake = true;

  this.fd = new b2.FixtureDef();
  this.fd.density = this.density;
  this.fd.restitution = 0.1; // bounciness
  this.fd.friction = 100; // only on contact (grip)
  this.fd.shape = new b2.PolygonShape();
  this.fd.filter.groupIndex = -1;

  this.torso_def = {
    upper_width: 0.25,
    upper_height: 0.45,
    lower_width: 0.25,
    lower_height: 0.2
  };

  this.leg_def = {
    femur_width: 0.18,
    femur_length: 0.45,
    tibia_width: 0.13,
    tibia_length: 0.38,
    foot_height: 0.08,
    foot_length: 0.28
  };

  this.arm_def = {
    arm_width: 0.12,
    arm_length: 0.37,
    forearm_width: 0.1,
    forearm_length: 0.42,
    // hand_height: 0.08,
    // hand_length: 0.20,
  }

  this.head_def = {
    head_width: 0.22,
    head_height: 0.22,
    neck_width: 0.1,
    neck_height: 0.08
  }

  this.joints = [];
  this.grips = [false, false, false, false]
  // this.frictionJoints = []

  this.torso = this.createTorso();
  this.left_leg = this.createLeg('left_');
  this.right_leg = this.createLeg('right_');
  this.left_arm = this.createArm('left_');
  this.right_arm = this.createArm('right_');
  this.head = this.createHead();
  this.connectParts();

  this.bodies = this.getBodies();

  // now apply a random starting positions and orientation
  this.randomise(0.5);


  // add grip
  // we don't have data on external forces, so I will just punish for contact with the ground
  http://blog.sethladd.com/2011/09/box2d-collision-damage-for-javascript.html
  // However we could use a listener or calc force
  var self = this
  this.contactListener = new b2.ContactListener()
  this.contactListener.BeginContact = function (contact, impulse) {
    if (contact.m_fixtureA.m_body.m_userData == "floor" | contact.m_fixtureB.m_body.m_userData) {
      var otherFixture = contact.m_fixtureA.m_body.m_userData == "floor" ? contact.m_fixtureB : contact.m_fixtureA
      if (otherFixture.m_body.m_userData == "right_foot") {
        // console.log('grip on ' + otherFixture.m_body.m_userData)
        // TODO let the agent act to grip or not. Only if palm or foot down?
        self.right_leg.frictionJoint.maxForce = 1000 * self.grips[0]
        self.right_leg.frictionJoint.maxTorque = 1000 * self.grips[0]
      } else if (otherFixture.m_body.m_userData == "left_foot") {
        // console.log('grip on ' + otherFixture.m_body.m_userData)
        self.left_leg.frictionJoint.maxForce = 1000 * self.grips[1]
        self.left_leg.frictionJoint.maxTorque = 1000 * self.grips[1]
      } else if (otherFixture.m_body.m_userData == "right_lower_arm") { 
        // console.log('grip off ' + otherFixture.m_body.m_userData)
        // TODO let the agent act to grip or not
        self.right_arm.frictionJoint.maxForce = 1000 * self.grips[2]
        self.right_arm.frictionJoint.maxTorque = 1000 * self.grips[2]
      } else if (otherFixture.m_body.m_userData == "left_lower_arm") { 
        // console.log('grip off ' + otherFixture.m_body.m_userData)
        self.left_arm.frictionJoint.maxForce = 1000 * self.grips[3]
        self.left_arm.frictionJoint.maxTorque = 1000 * self.grips[3]
      }
    }
  }
  this.contactListener.EndContact = function (contact, impulse) {
    if (contact.m_fixtureA.m_body.m_userData == "floor" | contact.m_fixtureB.m_body.m_userData) {
      var otherFixture = contact.m_fixtureA.m_body.m_userData == "floor" ? contact.m_fixtureB : contact.m_fixtureA
      if (otherFixture.m_body.m_userData == "right_foot") { 
        // console.log('grip off ' + otherFixture.m_body.m_userData)
        // TODO let the agent act to grip or not
        setTimeout(() => { self.right_leg.frictionJoint.maxForce = 0 }, 100)
        setTimeout(() => { self.right_leg.frictionJoint.maxTorque = 0 }, 100)
      } else if (otherFixture.m_body.m_userData == "left_foot") { 
        // console.log('grip off ' + otherFixture.m_body.m_userData)
        self.left_leg.frictionJoint.maxForce = 0
        self.left_leg.frictionJoint.maxTorque = 0
      } else if (otherFixture.m_body.m_userData == "right_lower_arm") { 
        // console.log('grip off ' + otherFixture.m_body.m_userData)
        // TODO let the agent act to grip or not
        setTimeout(() => { self.right_arm.frictionJoint.maxForce = 0 }, 100)
        setTimeout(() => { self.right_arm.frictionJoint.maxTorque = 0 }, 100)
      } else if (otherFixture.m_body.m_userData == "left_lower_arm") { 
        // console.log('grip off ' + otherFixture.m_body.m_userData)
        self.left_arm.frictionJoint.maxForce = 0
        self.left_arm.frictionJoint.maxTorque = 0
      }
     }
  }
  globals.world.SetContactListener(this.contactListener)

}

Walker.prototype.createTorso = function() {
  // upper torso
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height + this.torso_def.upper_height/2);
  var upper_torso = this.world.CreateBody(this.bd);
  upper_torso.SetUserData('upper_torso')

  this.fd.shape.SetAsBox(this.torso_def.upper_width/2, this.torso_def.upper_height/2);
  upper_torso.CreateFixture(this.fd);

  // lower torso
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height/2);
  var lower_torso = this.world.CreateBody(this.bd);
  lower_torso.SetUserData('lower_torso'  )

  this.fd.shape.SetAsBox(this.torso_def.lower_width/2, this.torso_def.lower_height/2);
  lower_torso.CreateFixture(this.fd);

  // torso joint
  // Note for more info see : https://github.com/openai/gym/wiki/Humanoid-V1
  // For 3d definition https://github.com/openai/gym/blob/master/gym/envs/mujoco/assets/humanoid.xml
  var jd = new b2.RevoluteJointDef();
  var position = upper_torso.GetPosition().Clone();
  position.y -= this.torso_def.upper_height/2;
  position.x -= this.torso_def.lower_width/3;
  jd.Initialize(upper_torso, lower_torso, position);
  jd.lowerAngle = deg2rad(-75/2);
  jd.upperAngle = deg2rad(30 / 2);
  jd.enableLimit = true;
  jd.maxMotorTorque = 150 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  var j = this.world.CreateJoint(jd)
  j.SetUserData('torso_joint'  )
  this.joints.push(j);

  return {upper_torso: upper_torso, lower_torso: lower_torso};
}

Walker.prototype.createLeg = function(label) {
  // upper leg
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length/2);
  var upper_leg = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.leg_def.femur_width/2, this.leg_def.femur_length/2);
  upper_leg.CreateFixture(this.fd);
  upper_leg.SetUserData(label + 'upper_leg')

  // lower leg
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length/2);
  var lower_leg = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.leg_def.tibia_width/2, this.leg_def.tibia_length/2);
  lower_leg.CreateFixture(this.fd);
  lower_leg.SetUserData(label + 'lower_leg')

  // foot
  this.bd.position.Set(0.5, this.leg_def.foot_height/2);
  var foot = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.leg_def.foot_length/2, this.leg_def.foot_height/2);
  foot.CreateFixture(this.fd);
  foot.SetUserData(label + 'foot')
  // foot.GetLinearDamping(100)

  var fjd = new b2.FrictionJointDef();
  var position = new b2.Vec2(0,0)
  fjd.Initialize(foot, globals.floor, position)
  fjd.maxForce = 0; //This the most force the joint will apply to your object. The faster its moving the more force applied
  fjd.maxTorque = 0; //Set to 0 to prevent rotation
  fjd.userData = label+'foot_friction_joint'
  fjd.collideConnected = true
  var frictionJoint = this.world.CreateJoint(fjd)

  // leg joints
  var jd = new b2.RevoluteJointDef();
  var position = upper_leg.GetPosition().Clone();
  position.y -= this.leg_def.femur_length/2;
  position.x += this.leg_def.femur_width/4;
  jd.Initialize(upper_leg, lower_leg, position);
  jd.lowerAngle = deg2rad(-100);
  jd.upperAngle = deg2rad(-2);
  jd.enableLimit = true;
  jd.maxMotorTorque = 260 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  var j = this.world.CreateJoint(jd)
  j.SetUserData(label + 'leg_joint')
  this.joints.push(j);

  // foot joint
  var jd = new b2.RevoluteJointDef();
  var position = lower_leg.GetPosition().Clone();
  position.y -= this.leg_def.tibia_length/2;
  jd.Initialize(lower_leg, foot, position);
  jd.lowerAngle = -Math.PI/5;
  jd.upperAngle = Math.PI/6;
  jd.enableLimit = true;
  jd.maxMotorTorque = 90 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  var j = this.world.CreateJoint(jd)
  j.SetUserData(label + 'foot_joint')
  this.joints.push(j);

  return {upper_leg: upper_leg, lower_leg: lower_leg, foot:foot, frictionJoint:frictionJoint};
}

Walker.prototype.createArm = function(label) {
  // upper arm
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height + this.torso_def.upper_height - this.arm_def.arm_length/2);
  var upper_arm = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.arm_def.arm_width/2, this.arm_def.arm_length/2);
  upper_arm.CreateFixture(this.fd);
  upper_arm.SetUserData(label + 'upper_arm')

  // lower arm
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height + this.torso_def.upper_height - this.arm_def.arm_length - this.arm_def.forearm_length/2);
  var lower_arm = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.arm_def.forearm_width/2, this.arm_def.forearm_length/2);
  lower_arm.CreateFixture(this.fd);
  lower_arm.SetUserData(label + 'lower_arm')


  // // hand
  // this.bd.position.Set(0.5, this.leg_def.hand_height/2);
  // var hand = this.world.CreateBody(this.bd);

  // this.fd.shape.SetAsBox(this.leg_def.hand_length/2, this.leg_def.hand_height/2);
  // hand.CreateFixture(this.fd);
  // hand.SetUserData(label + 'hand')

  // var fjd = new b2.FrictionJointDef();
  // var position = new b2.Vec2(0,0)
  // fjd.Initialize(lower_arm, globals.floor, position)
  // fjd.maxForce = 100; //This the most force the joint will apply to your object. The faster its moving the more force applied
  // fjd.maxTorque = 100; //Set to 0 to prevent rotation
  // var frictionJoint = this.world.CreateJoint(fjd)
  // // TODO only present when colliding?
  // // TODO this seems to preclude colliding, so made an ankle that has this?


  var fjd = new b2.FrictionJointDef();
  var position = new b2.Vec2(0,0)
  fjd.Initialize(lower_arm, globals.floor, position)
  fjd.maxForce = 0; //This the most force the joint will apply to your object. The faster its moving the more force applied
  fjd.maxTorque = 0; //Set to 0 to prevent rotation
  fjd.userData = label+'hand_friction_joint'
  fjd.collideConnected = true
  var frictionJoint = this.world.CreateJoint(fjd)


  // arm join
  var jd = new b2.RevoluteJointDef();
  var position = upper_arm.GetPosition().Clone();
  position.y -= this.arm_def.arm_length/2;
  jd.Initialize(upper_arm, lower_arm, position);
  jd.lowerAngle = deg2rad(0);
  jd.upperAngle = deg2rad(85);
  jd.enableLimit = true;
  jd.maxMotorTorque = 150 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  var j = this.world.CreateJoint(jd)
  j.SetUserData(label + 'arm_joint')
  this.joints.push(j);

  // // hand joint
  // var jd = new b2.RevoluteJointDef();
  // var position = lower_arm.GetPosition().Clone();
  // position.y -= this.arm_def.forearm_length/2;
  // jd.Initialize(lower_arm, hand, position);
  // jd.lowerAngle = deg2rad(-85);
  // jd.upperAngle = deg2rad(85);
  // jd.enableLimit = true;
  // jd.maxMotorTorque = 90 * STRENGTH;
  // jd.motorSpeed = 0;
  // jd.enableMotor = true;
  // var j = this.world.CreateJoint(jd)
  // j.SetUserData(label + 'hand_joint')
  // this.joints.push(j);

  return {
    upper_arm: upper_arm, lower_arm: lower_arm,
    // hand: hand,
    frictionJoint:frictionJoint
  };
}

Walker.prototype.createHead = function() {
  // neck
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height + this.torso_def.upper_height + this.head_def.neck_height/2);
  var neck = this.world.CreateBody(this.bd);
  
  this.fd.shape.SetAsBox(this.head_def.neck_width/2, this.head_def.neck_height/2);
  neck.CreateFixture(this.fd);
  neck.SetUserData('neck')

  // head
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height + this.torso_def.upper_height + this.head_def.neck_height + this.head_def.head_height/2);
  var head = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.head_def.head_width/2, this.head_def.head_height/2);
  head.CreateFixture(this.fd);
  head.SetUserData('head')

  // neck joint
  var jd = new b2.RevoluteJointDef();
  var position = neck.GetPosition().Clone();
  position.y += this.head_def.neck_height/2;
  jd.Initialize(head, neck, position);
  jd.lowerAngle = -0.1;
  jd.upperAngle = 0.2;
  jd.enableLimit = true;
  jd.maxMotorTorque = 4 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  var j = this.world.CreateJoint(jd)
  j.SetUserData('neck_joint')
  this.joints.push(j);

  return {head: head, neck: neck};
}

Walker.prototype.connectParts = function() {

  //neck/torso
  var jd = new b2.WeldJointDef();
  jd.bodyA = this.head.neck;
  jd.bodyB = this.torso.upper_torso;
  jd.localAnchorA = new b2.Vec2(0, -this.head_def.neck_height/2);
  jd.localAnchorB = new b2.Vec2(0, this.torso_def.upper_height/2);
  jd.referenceAngle = 0;
  var j = this.world.CreateJoint(jd);
  j.SetUserData('neck-joint')


  // torso/arms
  var jd = new b2.RevoluteJointDef();
  position = this.torso.upper_torso.GetPosition().Clone();
  position.y += this.torso_def.upper_height/2;
  jd.Initialize(this.torso.upper_torso, this.right_arm.upper_arm, position);
  jd.lowerAngle = deg2rad(-60);
  jd.upperAngle = deg2rad(125);
  jd.enableLimit = true;
  jd.maxMotorTorque = 250 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  var j = this.world.CreateJoint(jd)
  j.SetUserData('shoulder_right_joint')
  this.joints.push(j);

  var jd = new b2.RevoluteJointDef();
  jd.Initialize(this.torso.upper_torso, this.left_arm.upper_arm, position);
  jd.lowerAngle = deg2rad(-60);
  jd.upperAngle = deg2rad(125);
  jd.enableLimit = true;
  jd.maxMotorTorque = 250 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  var j = this.world.CreateJoint(jd)
  j.SetUserData('shoulder_right_joint')
  this.joints.push(j);

  // torso/legs
  var jd = new b2.RevoluteJointDef();
  position = this.torso.lower_torso.GetPosition().Clone();
  position.y -= this.torso_def.lower_height/2;
  jd.Initialize(this.torso.lower_torso, this.right_leg.upper_leg, position);
  jd.lowerAngle = deg2rad(-10);
  jd.upperAngle = deg2rad(80);
  jd.enableLimit = true;
  jd.maxMotorTorque = 400 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  var j = this.world.CreateJoint(jd)
  j.SetUserData('waist_right_joint')
  this.joints.push(j);

  var jd = new b2.RevoluteJointDef();
  jd.Initialize(this.torso.lower_torso, this.left_leg.upper_leg, position);
  jd.lowerAngle = deg2rad(-10);
  jd.upperAngle = deg2rad(80);
  jd.enableLimit = true;
  jd.maxMotorTorque = 400 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  var j = this.world.CreateJoint(jd)
  j.SetUserData('waist_left_joint')
  this.joints.push(j);
}

Walker.prototype.getBodies = function() {

  return [
    this.head.head,
    this.head.neck,
    this.torso.upper_torso,
    this.torso.lower_torso,
    this.left_arm.upper_arm,
    this.left_arm.lower_arm,
    // this.left_arm.hand,
    this.right_arm.upper_arm,
    this.right_arm.lower_arm,
    // this.right_arm.hand,
    this.left_leg.upper_leg,
    this.left_leg.lower_leg,
    this.left_leg.foot,
    this.right_leg.upper_leg,
    this.right_leg.lower_leg,
    this.right_leg.foot
  ];
}

Walker.prototype.randomise = function (n) { 
  for (var k = 0; k < this.joints.length; k++) {
    this.joints[k].SetMotorSpeed(Math.randf(-n, n))
  }
}

Walker.prototype.getState = function () {
  var self = this; 
  var state = []
  this.bodies
  .forEach((body) => {
      // see http://www.box2dflash.org/docs/2.0.2/reference/Box2D/Dynamics/b2Body.html#GetLocalVector()
      var t = body.GetTransform() // world transform of the body's origin. 
      state.push(t.p.x) // world transform of the body's origin. 
      state.push(t.p.y) // world transform of the body's origin. 
      state.push(t.q.s) // world transform of the body's origin. 
      state.push(t.q.c) // world transform of the body's origin. 
      
      var dt = body.GetLinearVelocity() // Get the linear velocity of the center of mass (world).       
      state.push(dt.x)
      state.push(dt.y)

      var lp = self.torso.upper_torso.GetLocalPoint(body.GetWorldCenter())// Get the bodypart position relative to the upper torso
      state.push(lp.x) 
      state.push(lp.y)

      state.push(body.GetAngularVelocity()) // the angular velocity in radians/second. 
      state.push(body.GetAngle())  // the current world rotation angle in radians. 
    }, [])
  this.joints.forEach(joint => { 
    // http://www.box2dflash.org/docs/2.0.2/reference/Box2D/Dynamics/Joints/b2RevoluteJoint.html
    state.push(joint.GetJointAngle()) // Get the current joint angle in radians.
    state.push(joint.GetJointSpeed()) // Get the current joint angle speed in radians per second
    state.push(joint.GetMotorSpeed())    
  })
  return state
}

Walker.prototype.simulationPreStep = function (motorSpeeds) {  
  // act
  for (var k = 0; k < this.joints.length; k++) {
    this.joints[k].SetMotorSpeed(motorSpeeds[k] * 10); // action can range from -3 to 3, radians per second
  }
  for (let i = this.joints.length; i < motorSpeeds.length; i++) {
    this.grips[i] = motorSpeeds[i] > 0
  }
  if (motorSpeeds[0] <= 0) this.right_leg.frictionJoint.maxForce = this.right_leg.frictionJoint.maxTorque
  if (motorSpeeds[1] <= 0) this.left_leg.frictionJoint.maxForce = this.left_leg.frictionJoint.maxTorque
  if (motorSpeeds[2] <= 0) this.left_arm.frictionJoint.maxForce = this.left_arm.frictionJoint.maxTorque
  if (motorSpeeds[3] <= 0) this.right_arm.frictionJoint.maxForce = this.right_arm.frictionJoint.maxTorque
  // TODO turn of grups
}

Walker.prototype.simulationStep = function (motorSpeeds) {
  this.steps++
  /* score/reward */
  // reward copied from OpenAI Gym Humanoid Walker https://github.com/openai/gym/blob/master/gym/envs/mujoco/humanoid.py
  // also see https://github.com/AdamStelmaszczyk/learning2run/blob/master/osim-rl/osim/env/run.py#L67
  // https://github.com/openai/gym/blob/master/gym/envs/mujoco/assets/humanoidstandup.xml

  // reward for keeping head up, compared to feet
  var mean_foot_height = (this.left_leg.foot.GetPosition().y + this.right_leg.foot.GetPosition().y)/2
  
  var head_height_reward = (this.head.head.GetPosition().y - mean_foot_height)* 400;  // it's head should be above it's feet 2*(-0.25-2)

  // reward for moving one leg beyond the other (stepping)
  var left_leg_forward = this.right_leg.foot.GetPosition().x > this.left_leg.foot.GetPosition().x;
  var leg_switch_reward = (left_leg_forward != this.last_left_left_forward) ? 4 : 0
  this.last_left_left_forward = left_leg_forward

  // cost for moving joints to unnatural positions (fraction of movement range in the relevant direction)
  var jointFractionMovement = j => j.GetJointAngle() > 0 ? j.GetJointAngle() / (j.GetUpperLimit() + 1) : j.GetJointAngle() / (j.GetLowerLimit() - 1)
  var quad_joint_angle_cost = - 0.10 * this.joints.map(j => jointFractionMovement(j) * 1.2)
    .reduce((o, v) => o + v * v, 0)
  quad_joint_angle_cost = Math.max(quad_joint_angle_cost, -10)

  // reward for moving right
  var position = this.torso.upper_torso.GetPosition().x
  if (this.last_position === undefined) this.last_position = position
  var velocity = (position - this.last_position) * 100
  this.last_position = position
  lin_vel_reward = 3 * velocity

  // punish for using energy, squared
  var quad_power_cost = -0.01 * this.joints.map(j => j.GetJointSpeed()).reduce((sum, speed) => sum + speed ** 2)
  quad_power_cost = Math.max(quad_power_cost, -10)

  // Lets be nice, all entities should find overall happiness in what they do
  var bonus_happiness = 5 

  // we don't have data on external forces, so I will just punish for contact with the ground
  http://blog.sethladd.com/2011/09/box2d-collision-damage-for-javascript.html
  // However we could use a listener or calc force
  // var listener = new b2.ContactListener()
  // listener.PostSolve = function (contact, impulse) {
  //     if (contact) console.log(contact)
  //   }
  //   globals.world.SetContactListener(listener)
  // }
  var contacts = this.bodies.map(b => b.GetContactList()).filter(b => b).length
  quad_contact_cost = -Math.min(contacts - 4, 10)/2

  this.rewards = {
    lin_vel_reward,
    quad_power_cost,
    quad_contact_cost,
    quad_joint_angle_cost,
    bonus_happiness,
    head_height_reward,
    leg_switch_reward
  }
  
  this.reward = Object.values(this.rewards).reduce((tot,v)=>tot+v, 0)/3

  var info = {
    episodeSteps: this.steps,
    reward:this.reward,
    position,
    ...this.rewards
  }
  var done = 0
  return [this.getState(), this.reward, done, info]
}
