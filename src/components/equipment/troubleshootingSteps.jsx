// Dynamic troubleshooting steps based on equipment type + issue type
export const getTroubleshootingSteps = (equipmentType, issueType) => {
  const stepsMap = {
    HearingAid: {
      NoSound: [
        "Is the hearing aid powered on?",
        "Check if the battery needs replacement.",
        "Inspect the earmold tubing for blockage or debris.",
        "Perform a listening check with the device.",
        "Check for visible moisture inside the battery compartment.",
        "Verify the volume control is not set to the minimum."
      ],
      IntermittentSound: [
        "Check the battery for corrosion or low charge.",
        "Clean the battery contacts gently.",
        "Ensure the earmold is properly seated.",
        "Check for moisture or debris in the microphone opening.",
        "Try a fresh battery if available.",
        "Perform a listening check with a new battery."
      ],
      DistortedSound: [
        "Check the volume setting is not too high.",
        "Inspect the microphone opening for blockage.",
        "Clean the earmold gently with a dry cloth.",
        "Check for cracks in the earmold tubing.",
        "Verify the device is not near magnetic fields.",
        "Perform a listening check after cleaning."
      ],
      TooLoud: [
        "Adjust the volume control to a lower setting.",
        "Check if the hearing aid is in the correct ear.",
        "Ensure the earmold is properly seated.",
        "Verify that the program setting is appropriate.",
        "Perform a listening check at a lower volume."
      ],
      TooSoft: [
        "Adjust the volume control to a higher setting.",
        "Check the battery charge level.",
        "Verify the microphone is not blocked.",
        "Ensure the earmold is properly seated.",
        "Check if a different program might be needed.",
        "Perform a listening check at a higher volume."
      ],
      FeedbackWhistling: [
        "Verify the earmold is fully seated in the ear.",
        "Check for cracks in the earmold or tubing.",
        "Lower the volume slightly.",
        "Remove and reinsert the earmold.",
        "Inspect the tubing for kinks or crimps.",
        "Perform a listening check after adjusting."
      ],
      WillNotTurnOn: [
        "Check the battery is inserted correctly.",
        "Inspect the battery for corrosion.",
        "Try a fresh battery if available.",
        "Ensure the battery compartment is closed properly.",
        "Wait a few moments and try again.",
        "Check for any visible damage to the device."
      ],
      BatteryIssue: [
        "Verify the battery type is correct for the device.",
        "Inspect the battery contacts for corrosion.",
        "Clean the contacts gently if needed.",
        "Try a fresh battery from a new pack.",
        "Check the battery expiration date.",
        "Perform a listening check with the new battery."
      ],
      TeacherUnsure: [
        "Power on the hearing aid if off.",
        "Check the battery charge level.",
        "Ensure the device is properly seated.",
        "Perform a listening check.",
        "Note any specific symptoms you observe.",
        "If the issue persists, contact audiology support."
      ]
    },
    CochlearImplant: {
      NoSound: [
        "Verify the processor is powered on.",
        "Check the battery or charger connection.",
        "Ensure the coil is properly positioned on the head.",
        "Perform a listening check with the device.",
        "Check for visible damage to the external parts.",
        "Try a fresh battery if applicable."
      ],
      IntermittentSound: [
        "Check the coil connection is secure.",
        "Verify the battery is adequately charged.",
        "Ensure the magnet is properly aligned.",
        "Perform a listening check.",
        "Try repositioning the coil slightly.",
        "Check for any loose cable connections."
      ],
      DistortedSound: [
        "Check the audio settings in the processor.",
        "Verify the coil is properly positioned.",
        "Ensure there is no interference from other devices.",
        "Perform a listening check.",
        "Check for any visible debris on the coil.",
        "Clean the coil connection gently."
      ],
      TooLoud: [
        "Adjust the program or volume settings.",
        "Verify the processor is in the correct mode.",
        "Ensure proper coil placement.",
        "Perform a listening check at adjusted settings."
      ],
      TooSoft: [
        "Adjust the program or volume settings.",
        "Check the battery charge level.",
        "Verify the coil is properly positioned.",
        "Perform a listening check at adjusted settings."
      ],
      TeacherUnsure: [
        "Verify the processor is powered on.",
        "Check the battery or charger status.",
        "Ensure the coil is securely positioned.",
        "Perform a listening check.",
        "Note any specific concerns.",
        "Contact the clinical team if issues persist."
      ]
    },
    BAHA: {
      NoSound: [
        "Verify the device is powered on.",
        "Check the battery charge level.",
        "Ensure the device is properly positioned on the bone.",
        "Perform a listening check.",
        "Check for any hair or debris under the device.",
        "Verify the connector is secure."
      ],
      IntermittentSound: [
        "Check the battery for corrosion or low charge.",
        "Ensure the device is seated firmly on the bone.",
        "Try a fresh battery if available.",
        "Perform a listening check.",
        "Check the cable connections for looseness."
      ],
      TooLoud: [
        "Adjust the volume control.",
        "Verify the device settings.",
        "Ensure proper positioning on the bone.",
        "Perform a listening check at lower volume."
      ],
      TooSoft: [
        "Adjust the volume control.",
        "Check the battery charge.",
        "Verify the device is seated properly.",
        "Perform a listening check at higher volume."
      ],
      TeacherUnsure: [
        "Power on the device.",
        "Check the battery status.",
        "Ensure the device is positioned on the bone.",
        "Perform a listening check.",
        "Note any observations.",
        "Contact audiology if needed."
      ]
    },
    FM_DM_System: {
      NoSound: [
        "Verify both the transmitter and receiver are powered on.",
        "Check the battery levels in both devices.",
        "Ensure the receiver is paired with the transmitter.",
        "Perform a listening check.",
        "Check for physical obstruction between devices.",
        "Verify the connection cable is secure."
      ],
      ConnectivityIssue: [
        "Check the transmitter is on and charged.",
        "Verify the receiver is on and charged.",
        "Ensure both devices are in pairing mode if needed.",
        "Move closer to the transmitter.",
        "Check for interference from other wireless devices.",
        "Perform a listening check after troubleshooting."
      ],
      IntermittentSound: [
        "Check battery levels in both devices.",
        "Verify the connection is secure.",
        "Move closer to the transmitter.",
        "Try repositioning the receiver.",
        "Check for interference from nearby devices.",
        "Perform a listening check."
      ],
      TeacherUnsure: [
        "Power on both the transmitter and receiver.",
        "Check battery levels.",
        "Verify pairing if needed.",
        "Perform a listening check.",
        "Note any specific issues.",
        "Contact support if problems continue."
      ]
    },
    SoundfieldSystem: {
      NoSound: [
        "Verify the speaker system is powered on.",
        "Check the amplifier connection.",
        "Ensure the microphone is activated.",
        "Test with a known audio source.",
        "Check all cable connections.",
        "Perform a listening check."
      ],
      IntermittentSound: [
        "Check all power connections.",
        "Verify the microphone battery if wireless.",
        "Ensure cables are fully seated.",
        "Check for loose connections.",
        "Test the microphone separately.",
        "Perform a listening check."
      ],
      DistortedSound: [
        "Check the volume level is not too high.",
        "Ensure the microphone is not obstructed.",
        "Verify the speaker cables are secure.",
        "Check for damage to any components.",
        "Adjust the input level if available.",
        "Perform a listening check."
      ],
      TeacherUnsure: [
        "Power on the soundfield system.",
        "Check all connections.",
        "Activate the microphone.",
        "Test with audio.",
        "Note any issues.",
        "Contact technical support if needed."
      ]
    },
    Charger: {
      WillNotTurnOn: [
        "Verify the charger is plugged in correctly.",
        "Check the power outlet is working.",
        "Inspect the charging cable for damage.",
        "Try a different power outlet.",
        "Wait a few moments and try again.",
        "Check for any visible damage to the charger."
      ],
      BatteryIssue: [
        "Ensure the device is properly inserted.",
        "Check the charging contacts are clean.",
        "Verify the correct charger for the device.",
        "Try charging in a different outlet.",
        "Ensure adequate charging time.",
        "Inspect the battery for damage."
      ],
      TeacherUnsure: [
        "Plug the charger in securely.",
        "Place the device in the charger.",
        "Check for any indicator lights.",
        "Wait for expected charging time.",
        "Verify the device powers on after charging."
      ]
    },
    Battery: {
      BatteryIssue: [
        "Verify you have the correct battery type.",
        "Check the battery expiration date.",
        "Inspect the battery for corrosion or leakage.",
        "Clean the battery contacts if needed.",
        "Try a fresh battery from a new pack.",
        "Verify the device works with the new battery."
      ],
      TeacherUnsure: [
        "Identify the correct battery type needed.",
        "Check the battery is not expired.",
        "Inspect the battery contacts.",
        "Insert the battery correctly.",
        "Verify the device powers on.",
        "Replace if the device still doesn't work."
      ]
    },
    Other: {
      TeacherUnsure: [
        "Describe the issue clearly.",
        "Check for obvious damage.",
        "Verify the device is powered on.",
        "Perform a basic functional check.",
        "Note any error indicators.",
        "Refer to the device manual if available."
      ]
    }
  };

  return stepsMap[equipmentType]?.[issueType] || stepsMap.Other.TeacherUnsure;
};

export const EQUIPMENT_LABELS = {
  HearingAid: "Hearing Aid",
  CochlearImplant: "Cochlear Implant",
  BAHA: "BAHA",
  FM_DM_System: "FM/DM System",
  SoundfieldSystem: "Soundfield System",
  Charger: "Charger",
  Battery: "Battery",
  Other: "Other"
};

export const ISSUE_LABELS = {
  NoSound: "No Sound",
  IntermittentSound: "Intermittent Sound",
  DistortedSound: "Distorted Sound",
  TooLoud: "Too Loud",
  TooSoft: "Too Soft",
  FeedbackWhistling: "Feedback/Whistling",
  WillNotTurnOn: "Won't Turn On",
  BatteryIssue: "Battery Issue",
  ConnectivityIssue: "Connectivity Issue",
  TeacherUnsure: "Not Sure What's Wrong"
};

export const RESPONSE_LABELS = {
  Yes: "Yes",
  No: "No",
  Unsure: "Unsure",
  Completed: "Completed",
  NotCompleted: "Not Completed",
  NotApplicable: "Not Applicable"
};