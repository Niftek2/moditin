// Spec-aligned fallback troubleshooting steps (used when AI is unavailable)
// Source: Modal Itinerant Equipment Troubleshooter AI Spec v1.0
// These reflect IDEA § 300.113 school-level scope only — no audiological programming steps.

export const getTroubleshootingSteps = (equipmentType, issueType) => {
  const stepsMap = {
    HearingAid: {
      NoSound: [
        "Check the battery: for zinc-air batteries, remove the tab and wait 1–2 minutes before inserting. This pause is required for battery activation and is a very common missed step.",
        "Verify the battery is inserted with the correct polarity (flat side matches the flat side of the compartment) and the battery door is fully closed.",
        "Inspect the earmold tubing for earwax, moisture, or visible blockage. Use a blower/puffer if available to clear the tubing.",
        "Check that the volume wheel or program button is not set to off or the lowest setting.",
        "Wipe the microphone inlet area gently with a dry cloth to clear any debris.",
        "Perform the Ling Six-Sound Check (/m/, /oo/, /ah/, /ee/, /sh/, /s/) to verify whether any sound is reaching the student."
      ],
      IntermittentSound: [
        "Check the battery: try a fresh zinc-air battery (remove tab, wait 1–2 minutes). Low batteries are the most common cause of intermittent sound.",
        "Clean the battery contacts in the compartment gently with a dry cloth or cotton swab — corrosion can cause intermittent connection.",
        "Check the earmold tubing is securely attached to the hearing aid nub. A partially detached tubing can cause signal dropout.",
        "Inspect the tubing for small cracks, kinks, or moisture inside. Hold it up to light to check for a moisture bubble.",
        "Check the microphone inlet for debris and wipe with a dry cloth.",
        "Perform the Ling Six-Sound Check to assess consistency of the device output."
      ],
      DistortedSound: [
        "Check whether the volume is set too high — reduce it one step and listen.",
        "Inspect the microphone opening for blockage or debris; wipe gently with a dry cloth.",
        "Inspect the earmold tubing for cracks — even a hairline crack can cause distortion. Replace if cracked.",
        "Check for moisture inside the tubing and use a blower/puffer to clear it.",
        "Place the device in a drying kit for 20–30 minutes if moisture is suspected.",
        "Perform the Ling Six-Sound Check after cleaning to assess sound quality."
      ],
      TooLoud: [
        "Adjust the volume wheel to a lower setting.",
        "Check whether the hearing aid is in the correct ear — wearing on the wrong ear can cause loudness perception issues.",
        "Verify the correct listening program is selected (if the aid has multiple programs).",
        "Ensure the earmold is fully and correctly seated in the ear.",
        "Perform the Ling Six-Sound Check at the adjusted setting to confirm appropriate output."
      ],
      TooSoft: [
        "Check the battery first: a low battery is the most common cause of reduced output. Try a fresh battery.",
        "Adjust the volume wheel to a higher setting.",
        "Inspect the earmold tubing and microphone inlet for blockage — even partial blockage reduces output significantly.",
        "Ensure the earmold is fully and correctly seated in the ear.",
        "Check whether a different listening program might be needed for the current environment.",
        "Perform the Ling Six-Sound Check to verify audibility at the corrected setting."
      ],
      FeedbackWhistling: [
        "Remove and re-insert the earmold carefully — feedback most often indicates the earmold is not fully seated in the ear canal.",
        "Check for cracks in the earmold tubing or earmold shell — even a small crack allows sound to leak and cause feedback.",
        "Lower the volume slightly — high volume + imperfect earmold fit causes feedback.",
        "Check whether the child has recently grown — a poor-fitting earmold from growth requires replacement (contact the student's audiologist to order a new earmold).",
        "Inspect the connection between the tubing and the hearing aid hook/nub to ensure it's airtight.",
        "If feedback persists after re-insertion, document and contact the family/audiologist — the earmold may need to be replaced."
      ],
      WillNotTurnOn: [
        "Verify the battery is inserted correctly and the door is fully closed.",
        "Try a fresh battery: zinc-air batteries — remove tab, wait 1–2 minutes, insert.",
        "Inspect the battery and battery contacts for visible corrosion. Do not use a corroded battery.",
        "Check whether the battery door is damaged or not latching properly.",
        "If the device still will not power on after a fresh battery, document and contact the family — the device may need service."
      ],
      BatteryIssue: [
        "Verify you have the correct battery size for this hearing aid (common sizes: 10, 13, 312, 675 — check the battery door or device documentation).",
        "Remove the tab from the zinc-air battery and wait 1–2 minutes before inserting — this is required for proper activation.",
        "Check the expiration date on the battery package — expired batteries underperform.",
        "Inspect the battery contacts in the compartment for corrosion and clean gently if present.",
        "Try a battery from a different sealed pack in case the current pack is faulty.",
        "Perform the Ling Six-Sound Check with the fresh battery to confirm the device is working."
      ],
      ConnectivityIssue: [
        "Check that the FM or Roger receiver is properly attached to the hearing aid and the connection is secure.",
        "Verify both the hearing aid and FM/DM receiver are powered on.",
        "Check battery levels in both the FM transmitter and receiver.",
        "Ensure the hearing aid volume and program are in the correct setting for FM use.",
        "Perform the Ling Six-Sound Check with the FM system active to verify the connection is working."
      ],
      TeacherUnsure: [
        "Start with the battery: remove the old battery, insert a fresh zinc-air battery (remove tab, wait 1–2 min), and power the device on.",
        "Check that the earmold is properly seated in the ear and the hearing aid is securely hooked over the ear.",
        "Inspect the earmold tubing for visible blockage, moisture, or kinking.",
        "Check the volume wheel and program button are in normal daily positions.",
        "Perform the Ling Six-Sound Check to functionally assess whether the student can detect sounds through the device.",
        "If the issue is not resolved after these steps, note specific observations and contact the family or audiologist."
      ]
    },

    CochlearImplant: {
      NoSound: [
        "Verify the sound processor is powered on — check indicator lights for status.",
        "Check the battery: replace disposable batteries or ensure rechargeable battery is charged. CI processors display low battery warnings — check for flashing or color-coded indicators.",
        "Check that the coil (headpiece) is correctly positioned over the implant site on the skull — hair or clothing underneath the coil disrupts the magnetic connection and blocks signal.",
        "For bilateral CI users: verify each processor is on its correct side (left processor on the left ear).",
        "Inspect any connecting cables between the processor and coil for visible kinks or damage — do not attempt to repair. If cable is damaged, contact the family.",
        "Perform the Ling Six-Sound Check to functionally verify audibility once device appears powered."
      ],
      IntermittentSound: [
        "Check battery charge — low battery is the most common cause of intermittent CI function.",
        "Check that the coil is properly positioned and the magnet is holding securely; hair between the coil and scalp can cause intermittent signal dropout.",
        "Inspect the coil cable (if present) for partial damage or loose connector at either end.",
        "Ensure the processor is worn securely and not moving or shifting during activity.",
        "If the student reports crackling or intermittent cutting in and out, document carefully and contact the family and audiologist — this may indicate an internal component concern."
      ],
      DistortedSound: [
        "Check the battery level and replace or recharge if low.",
        "Verify the coil is correctly and firmly positioned over the implant site.",
        "Inspect the coil cable for kinks, partial damage, or loose connections.",
        "Check for any electronic interference sources nearby (some wireless devices can interfere with CI processors).",
        "If distortion persists after these checks, document and contact the family and the student's audiologist — do not attempt to adjust processing settings."
      ],
      TooLoud: [
        "Do NOT adjust the processor's internal programming. Volume/sensitivity adjustments are set by the student's audiologist.",
        "Check whether the student accidentally changed a user-accessible volume or sensitivity control — return it to the student's usual setting if known.",
        "Verify the listening program selected is appropriate for the current environment.",
        "Contact the family to confirm the correct settings and report the concern — the audiologist may need to adjust the MAP at the next appointment."
      ],
      TooSoft: [
        "Check the battery — depleted batteries are the most common cause of reduced CI output.",
        "Check that the coil is correctly positioned over the implant site with good magnetic contact.",
        "Verify the appropriate listening program is selected.",
        "Do NOT attempt to increase gain or sensitivity settings — these are audiologist-managed.",
        "Perform the Ling Six-Sound Check to assess functional audibility and document results.",
        "If the student consistently reports softer sound across sessions, contact the family and audiologist."
      ],
      FeedbackWhistling: [
        "CI processors typically do not produce acoustic feedback like hearing aids do. A whistling sound may indicate the processor is near a hearing aid or FM transmitter — move apart.",
        "If the student reports a tone or internal noise, this is NOT a school-correctable issue — document the description carefully and contact the family and audiologist immediately.",
        "Check whether the issue is actually from a nearby hearing aid worn by the same or another student creating acoustic feedback in the environment."
      ],
      WillNotTurnOn: [
        "Check the battery: replace disposable batteries or confirm the rechargeable battery unit is charged and properly seated in the processor.",
        "Check whether the processor is correctly assembled (battery door closed, all components connected).",
        "Look for indicator lights — some processors flash a specific pattern when battery is too low to power on.",
        "If the processor still will not turn on with a known-good battery, document and contact the family immediately — do not attempt to open or repair the device."
      ],
      BatteryIssue: [
        "For rechargeable CI processors: verify the processor charged overnight in the correct charger. Check the charger indicator lights.",
        "For disposable battery processors: verify the correct battery size and type (refer to family documentation — do not substitute with unapproved battery types).",
        "Inspect battery contacts for debris.",
        "If the battery drains unusually quickly, document and report to the family — may indicate a processor issue for the audiologist to assess."
      ],
      ConnectivityIssue: [
        "Check that the FM or Roger receiver compatible with the CI system is properly connected or streaming.",
        "Verify the FM transmitter is on and charged.",
        "Confirm the channel or program selected on the CI processor is the one intended for FM use.",
        "Contact the student's audiologist or district FM coordinator if pairing or program selection is unclear."
      ],
      TeacherUnsure: [
        "Verify the processor is powered on and check indicator lights for status.",
        "Check the battery level and replace or recharge if needed.",
        "Check that the coil/headpiece is correctly positioned and holding magnetically.",
        "Perform the Ling Six-Sound Check to assess whether the student can detect sounds.",
        "Note the specific behavior you observed (lights, sounds, student report) and contact the family if anything remains unclear or unresolved."
      ]
    },

    BAHA: {
      NoSound: [
        "Check the battery: verify it is charged (rechargeable) or replace the disposable battery. Confirm correct battery size.",
        "For percutaneous (abutment) systems: press the processor gently onto the abutment to confirm it is firmly snapped in. A loose connection is a common cause of no sound.",
        "For transcutaneous/magnetic systems: reposition the processor disc over the implant site and ensure the magnet is attracting properly.",
        "Inspect for hair, clothing, or debris between the processor and the abutment/skin that may be disrupting connection.",
        "Perform the Ling Six-Sound Check to verify any audibility once device is secured.",
        "If no sound after these checks, document and contact the family and student's audiologist."
      ],
      IntermittentSound: [
        "Check the battery — a low battery is the most common cause of intermittent output.",
        "For abutment systems: ensure the processor is snapping firmly onto the abutment and is not loose.",
        "For magnetic systems: check whether the processor disc is shifting position — repositioning may resolve it.",
        "Document the pattern of dropout (only during movement? Only in certain positions?) — this information is helpful for the audiologist.",
        "Perform the Ling Six-Sound Check and note results."
      ],
      TooLoud: [
        "Check whether the student or another person inadvertently changed a user-accessible volume control.",
        "Do NOT adjust audiological programming or processing settings — contact the student's audiologist.",
        "Contact the family to report and confirm normal settings."
      ],
      TooSoft: [
        "Check the battery — low battery reduces output significantly.",
        "Ensure the processor has firm contact at the implant site (abutment snap-in or magnet position).",
        "Perform the Ling Six-Sound Check to document the current level of audibility.",
        "If output is consistently soft, report to the family and audiologist — may need programming adjustment."
      ],
      WillNotTurnOn: [
        "Check the battery: replace disposable or confirm rechargeable battery is charged.",
        "Verify the processor is correctly assembled.",
        "If still not powering on, document and contact the family. Do not attempt internal repair."
      ],
      ConnectivityIssue: [
        "Verify the FM or DM receiver compatible with the BAHA system is properly connected.",
        "Check FM transmitter battery and power.",
        "Contact the student's audiologist or district coordinator if system pairing is required."
      ],
      TeacherUnsure: [
        "Check battery and power the device on.",
        "Ensure the processor is properly connected to the abutment or positioned magnetically on the implant site.",
        "Perform the Ling Six-Sound Check to assess functional audibility.",
        "Note any observations and contact the family if issue persists."
      ]
    },

    FM_DM_System: {
      NoSound: [
        "Check battery levels in BOTH the transmitter (worn by the speaker) and the receiver (connected to the student's device) — low battery in either device stops the system from working.",
        "Verify the transmitter is powered on and is actively transmitting (indicator light active). Verify the receiver is powered on.",
        "Ensure the receiver is correctly connected to the student's hearing device — check that the shoe/connector is fully seated.",
        "Check that the transmitter microphone is not muted. Some transmitters have a mute button or switch.",
        "Move the transmitter and receiver closer together and test — distance and physical barriers (walls, bodies) reduce signal.",
        "Perform the Ling Six-Sound Check with the FM system active to verify signal is reaching the student's device."
      ],
      ConnectivityIssue: [
        "Verify both transmitter and receiver are powered on with adequate battery charge.",
        "Check for radio frequency interference: some lighting systems (fluorescent ballasts), wireless networks (Wi-Fi), and other FM systems in the building can interfere.",
        "Ensure transmitter and receiver are set to the same channel or frequency (if adjustable — check family/audiologist documentation for correct channel).",
        "Move closer to the transmitter and check whether signal improves with proximity.",
        "If re-pairing is needed, consult the family or district FM coordinator — pairing steps are device-specific and beyond the school general staff scope.",
        "Perform Ling check with FM active once connection issues are addressed."
      ],
      IntermittentSound: [
        "Check battery levels in transmitter and receiver — intermittent dropout is frequently a sign of low battery.",
        "Verify the receiver-to-hearing-device connection is secure — a slightly loose boot/shoe can cause intermittent signal.",
        "Check for interference from nearby wireless devices or building systems.",
        "Move transmitter and receiver closer and test for improved consistency.",
        "Document the pattern (only during movement? Only in certain rooms?) — useful for the audiologist or FM coordinator."
      ],
      DistortedSound: [
        "Check battery levels in transmitter and receiver.",
        "Verify the microphone is not obstructed or partially covered.",
        "Check for RF interference from nearby devices.",
        "Ensure the transmitter-to-receiver connection is on a clear channel.",
        "Perform Ling check to assess current sound quality."
      ],
      TeacherUnsure: [
        "Power on both the transmitter and the receiver and verify indicator lights.",
        "Check battery levels in both devices.",
        "Ensure the receiver is securely attached to the student's hearing device.",
        "Test by speaking into the transmitter microphone from 1 meter away while the student listens.",
        "Perform the Ling Six-Sound Check with the FM system active.",
        "Contact the student's audiologist or district FM coordinator if the system is not functioning after these steps."
      ]
    },

    SoundfieldSystem: {
      NoSound: [
        "Verify the amplifier is powered on — check the power button and indicator light.",
        "Check all cable connections between the amplifier, speakers, and microphone are fully seated.",
        "If using a wireless microphone, check the microphone battery and ensure it is powered on.",
        "Check the volume controls on both the amplifier and the microphone are not at zero.",
        "Test with a different known audio source (speak into the mic from close range) to isolate whether the issue is with the microphone or the amplifier/speakers.",
        "Perform a basic listening check by standing near the speakers and testing microphone input."
      ],
      IntermittentSound: [
        "Check microphone battery if wireless — intermittent dropout is often a sign of low microphone battery.",
        "Verify all cable connections are secure and not partially pulled out.",
        "Test whether the issue is environmental interference — some classroom lighting or electronics can interfere.",
        "Check whether the microphone is experiencing dropout when moved — may indicate a loose internal connection.",
        "Contact school IT or building administration if hardware issue is suspected."
      ],
      DistortedSound: [
        "Check that the amplifier volume is not set too high — turn down and test.",
        "Verify the microphone is not too close to the speakers (causing acoustic feedback).",
        "Check that speaker cables are not damaged.",
        "Adjust the input gain or EQ if available and accessible controls allow.",
        "Contact school IT or building administration if distortion persists."
      ],
      FeedbackWhistling: [
        "Move the microphone further from the speakers.",
        "Reduce the amplifier volume.",
        "Check whether any nearby hearing aids are picking up and re-amplifying the speaker output — soundfield output can cause feedback in nearby hearing aids.",
        "Turn the system off momentarily and restart.",
        "Contact school IT if feedback is structural to the room setup."
      ],
      TeacherUnsure: [
        "Power on the amplifier and verify the indicator light.",
        "Check all connections and microphone battery.",
        "Test by speaking into the microphone and listening for output from the speakers.",
        "Adjust volume controls if needed.",
        "Contact school IT or the building administrator if the system does not function after these steps."
      ]
    },

    Charger: {
      WillNotTurnOn: [
        "Verify the charger is plugged into a functioning power outlet — test the outlet with another device.",
        "Inspect the charging cable for visible damage, fraying, or bent connectors.",
        "Try a different power outlet.",
        "Ensure the hearing device is correctly seated in the charging cradle — the indicator light should activate when properly placed.",
        "Check whether the indicator light or display on the charger shows any error state.",
        "Contact the family if the charger itself appears to be malfunctioning."
      ],
      BatteryIssue: [
        "Ensure the correct charger is being used for this specific device — using a generic or incorrect charger may not charge properly.",
        "Check the charging contacts on both the charger and the device for debris — clean gently with a dry cloth.",
        "Ensure adequate charging time has elapsed (most devices require 3–8 hours for a full charge — refer to family documentation).",
        "Verify the indicator light changes from charging to charged as expected.",
        "If the device still shows low battery after a full charge cycle, document and contact the family."
      ],
      TeacherUnsure: [
        "Plug the charger into a working outlet and place the device in the cradle.",
        "Check for indicator lights confirming charging has started.",
        "Leave for the expected charging period.",
        "Verify the device powers on and functions after charging.",
        "Contact the family if the charger does not appear to function."
      ]
    },

    Battery: {
      BatteryIssue: [
        "Verify you have the correct battery SIZE for this device (hearing aid batteries: size 10, 13, 312, or 675 — check the battery door color code or family documentation).",
        "For zinc-air batteries: remove the sticky tab and wait 1–2 minutes before inserting. This oxygen-activation pause is required and is frequently skipped.",
        "Check the battery expiration date on the package — expired batteries underperform or fail immediately.",
        "Inspect the battery for corrosion, leakage, or swelling. Never insert a damaged battery.",
        "Clean the battery contacts in the device compartment gently with a dry cloth if they appear corroded.",
        "Try a battery from a different sealed pack in case the current pack is defective."
      ],
      TeacherUnsure: [
        "Identify the correct battery size for the device (check the battery compartment door, which is often color-coded: yellow=10, orange=13, brown=312, blue=675).",
        "Remove the zinc-air tab and wait 1–2 minutes before inserting.",
        "Insert battery with correct polarity and close the door completely.",
        "Power on the device and check indicator lights.",
        "Replace the battery again if the device still does not function normally."
      ]
    },

    Other: {
      TeacherUnsure: [
        "Check that the device is powered on.",
        "Check the battery or power source.",
        "Inspect the device for visible damage, loose connections, or obvious debris.",
        "Perform a basic functional check relevant to the device type.",
        "Note any error indicators (lights, tones, display messages) — document these precisely.",
        "If you cannot identify or resolve the issue, contact the family and, if hearing-related, the student's audiologist."
      ]
    }
  };

  return stepsMap[equipmentType]?.[issueType] || stepsMap[equipmentType]?.TeacherUnsure || stepsMap.Other.TeacherUnsure;
};

export const EQUIPMENT_LABELS = {
  HearingAid: "Hearing Aid (BTE)",
  CochlearImplant: "Cochlear Implant",
  BAHA: "BAHA / Bone-Anchored Device",
  FM_DM_System: "FM / DM Remote Mic System",
  SoundfieldSystem: "Soundfield System",
  Charger: "Charger / Charging Case",
  Battery: "Battery",
  Other: "Other / Unknown"
};

export const ISSUE_LABELS = {
  NoSound: "No sound at all",
  IntermittentSound: "Sound cuts in and out",
  DistortedSound: "Sound is distorted or unclear",
  TooLoud: "Sound is too loud",
  TooSoft: "Sound is too soft / weak",
  FeedbackWhistling: "Feedback / whistling",
  WillNotTurnOn: "Won't turn on",
  BatteryIssue: "Battery not working",
  ConnectivityIssue: "Not connecting to FM / hearing device",
  TeacherUnsure: "Not sure — general check"
};

export const RESPONSE_LABELS = {
  Yes: "Yes — completed",
  No: "No — could not do this",
  Unsure: "Unsure",
  Completed: "Done",
  NotCompleted: "Not completed",
  NotApplicable: "Not applicable"
};