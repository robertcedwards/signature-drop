import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function generateMintSignature(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // De-construct body from request
  const { address } = JSON.parse(req.body);

  // Get the Early Access NFT Edition Drop contract
  const polygonSDK = new ThirdwebSDK("polygon");
  const earlyAccessNfts = await polygonSDK.getContract(
    "0xe8A36dDfE6a838157f149114b5792E29048Fc0E5",
    "edition-drop"
  );

  // Check to see if the wallet address has an early access NFT
  const numTokensInCollection = await earlyAccessNfts.getTotalCount();
  let userHasToken = false;
  // Check each token in the Edition Drop
  for (let i = 0; i < numTokensInCollection.toNumber(); i++) {
    // See if they have the token
    const balance = await earlyAccessNfts.balanceOf(address, i);
    if (balance.toNumber() > 0) {
      userHasToken = true;
      break;
    }
  }

  // Now use the SDK on Goerli to get the signature drop
  const goerliSDK = ThirdwebSDK.fromPrivateKey(
    process.env.PRIVATE_KEY as string,
    "goerli"
  );
  const signatureDrop = await goerliSDK.getContract(
    "0xe8A36dDfE6a838157f149114b5792E29048Fc0E5",
    "signature-drop"
  );

  // If the user has an early access NFT, generate a mint signature
  if (userHasToken) {
    const mintSignature = await signatureDrop.signature.generate({
      to: address, // Can only be minted by the address we checked earlier
      price: "0", // Free!
      mintStartTime: new Date(0), // now
    });

    res.status(200).json(mintSignature);
  } else {
    res.status(400).json({
      message: "User does not have an early access NFT",
    });
  }
}
