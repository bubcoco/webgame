// async function claimTokens(score: number, userAddress: string) {
//   const res = await fetch(`/api/claim?address=${userAddress}&score=${score}`);
//   const data = await res.json();

//   if (data.signature) {
//     // Now call your contract’s claim function
//     const tx = await gameTokenContract.claimTokens(
//       userAddress,
//       score,
//       data.signature
//     );
//     await tx.wait();
//     alert("Tokens claimed!");
//   } else {
//     alert("Claim failed");
//   }
// }
