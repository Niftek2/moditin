export const LABELING_ACTIVITIES = {
  hearingAid: {
    id: "hearingAid",
    title: "Label the Hearing Aid",
    description: "Identify the parts of a hearing aid",
    labels: [
      { id: "earhook", name: "EARHOOK", correctPosition: { top: "15%", right: "28%" } },
      { id: "controlButtons", name: "CONTROL BUTTONS", correctPosition: { top: "22%", right: "5%" } },
      { id: "microphone", name: "MICROPHONE", correctPosition: { top: "38%", right: "12%" } },
      { id: "amplifier", name: "AMPLIFIER", correctPosition: { top: "50%", right: "5%" } },
      { id: "tubing", name: "TUBING", correctPosition: { top: "35%", left: "15%" } },
      { id: "earmold", name: "EARMOLD", correctPosition: { bottom: "22%", left: "12%" } },
      { id: "compartment", name: "COMPARTMENT", correctPosition: { bottom: "12%", right: "8%" } },
    ],
  },
  cochlearImplant: {
    id: "cochlearImplant",
    title: "Label the Cochlear Implant",
    description: "Identify the parts of a cochlear implant",
    labels: [
      { id: "coilMagnet", name: "COIL/MAGNET", correctPosition: { top: "8%", right: "18%" } },
      { id: "controlButtons", name: "CONTROL BUTTONS", correctPosition: { top: "20%", right: "12%" } },
      { id: "microphone", name: "MICROPHONE", correctPosition: { top: "45%", left: "8%" } },
      { id: "soundProcessor", name: "SOUND PROCESSOR", correctPosition: { top: "65%", left: "12%" } },
      { id: "batteryPack", name: "BATTERY PACK", correctPosition: { bottom: "35%", left: "10%" } },
      { id: "cable", name: "CABLE", correctPosition: { bottom: "15%", right: "12%" } },
    ],
  },
};