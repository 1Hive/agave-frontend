import { Box, Button, Center, Flex, Stack, Text, useColorModeValue } from "@chakra-ui/react";
import ColoredText from "../../components/ColoredText";
import { fontSizes } from "../../utils/constants";
import { isDesktop } from "react-device-detect";
import { useAppWeb3 } from "../../hooks/appWeb3";

export const SwapperBanner: React.FC<{}> = props => {
    return (
        <>
            <Center width="100%" justifyContent="space-between">
                <Text
                    fontWeight="bold"
                    color="white"
                    fontSize={{ base: "1.8rem", md: "2.4rem" }}
                >
                    Swap
                </Text>
                <Text
                    fontWeight="normal"
                    color="white"
                >
                    No proxy contract
                </Text>
            </Center>
        </>
    );
}

export const CreateProxyLayout: React.FC<{}> = props => {
    
    const address: string | undefined = useAppWeb3().account ?? undefined;
    return (
        <Center
        w={ "100%"}
        boxSizing="content-box"
        flexDirection="column"
        rounded="xl"
        float="left"
        minH="25.6rem"
        bg="primary.900"
        px={{ base: "0rem", md: "0rem" }}
        py="2.4rem"
        {...props}
      >
        <ColoredText
          fontSize={{ base: "1.6rem", md: "1.8rem" }}
          textAlign="center"
        >
          No proxy contract
        </ColoredText>
        <Text
          color="white"
          textAlign="center"
          margin="2.8rem"
          fontSize={{ base: fontSizes.md, md: "inherit" }}
        >
          You need to create a proxy contract in order to place orders
        </Text>

        <Box>
          <Button
            bg={useColorModeValue({ base: "primary.500", md: "primary.500" }, "primary.500")}
            colorScheme="teal"
            size="xl"
            h="40px"
            margin="10px"
            padding="20px"
          >
            Create proxy contract
          </Button>

        </Box>
      </Center>
    )
}



export const SwapperLayout: React.FC<{}> = props => {
    return (
        <>
            <CreateProxyLayout />
        </>
    );
}