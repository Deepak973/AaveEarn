"use client";

import { useState } from "react";
import Image from "next/image";
import { SupplyAssetsList } from "@/components/ui/supply/SupplyAssetsList";
import { YourSupplies } from "@/components/ui/supply/YourSupplies";
import { useAccount, useConnect } from "wagmi";
import {
  Tabs,
  Tab,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Paper,
  Grid,
  IconButton,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Close } from "@mui/icons-material";
import { useAppDataContext } from "~/hooks/app-data-provider/useAppDataProvider";
import { useRootStore } from "~/store/root";
import { useMiniApp } from "@neynar/react";

// Custom styled components
const CustomTabs = styled(Tabs)({
  "& .MuiTabs-indicator": {
    backgroundColor: "#6B7280",
  },
});

const CustomTab = styled(Tab)({
  color: "rgba(255, 255, 255, 0.6)",
  fontSize: "0.875rem",
  fontWeight: 500,
  "&.Mui-selected": {
    color: "#9CA3AF",
  },
  "&:hover": {
    color: "#ffffff",
  },
});

const StatsCard = styled(Card)(({ theme }) => ({
  background: "rgba(17, 24, 39, 0.8)",
  border: "1px solid rgba(75, 85, 99, 0.3)",
  borderRadius: "12px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    border: "1px solid rgba(107, 114, 128, 0.5)",
    backgroundColor: "rgba(17, 24, 39, 0.9)",
  },
}));

const BottomSheet = styled(Paper)(({ theme }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  maxHeight: "60vh",
  background: "rgba(17, 24, 39, 0.95)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(75, 85, 99, 0.3)",
  borderRadius: "16px 16px 0 0",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
}));

export default function Home() {
  const [currentTab, setCurrentTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { user, loading: loadingUser } = useAppDataContext();
  const { context } = useMiniApp();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={60}
            height={60}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-white mb-2">
            Earn on Aave
          </h1>
          <h2 className="text-gray-400 mb-8 text-sm">
            {context?.user?.pfpUrl && (
              <img
                src={context.user.pfpUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-primary"
              />
            )}
          </h2>
          <p className="text-gray-400 mb-8 text-sm">
            Connect your wallet to start earning yield
          </p>
        </div>
        <Button
          variant="contained"
          size="medium"
          onClick={() => connect({ connector: connectors[0] })}
          sx={{
            background: "#374151",
            color: "white",
            px: 3,
            py: 1.5,
            fontSize: "0.875rem",
            fontWeight: 500,
            borderRadius: "8px",
            "&:hover": {
              background: "#4B5563",
            },
          }}
        >
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={32} height={32} />
          <h1 className="text-xl font-semibold text-white">Earn on Aave</h1>
        </div>
      </div>

      {/* Single Stats Card */}
      <Box sx={{ mb: 4 }}>
        <StatsCard onClick={handleCardClick}>
          <CardContent sx={{ p: 3 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                {/* Net Worth Section */}
                <div>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255, 255, 255, 0.6)",
                      mb: 1,
                      fontSize: "0.75rem",
                    }}
                  >
                    Net Worth
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ color: "white", fontWeight: 600 }}
                  >
                    {loadingUser
                      ? "..."
                      : `$${
                          user?.netWorthUSD
                            ? (+user.netWorthUSD).toFixed(2)
                            : "0.00"
                        }`}
                  </Typography>
                </div>

                {/* Divider */}
                <div className="w-px h-10 bg-gray-700"></div>

                {/* APY Section */}
                <div>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255, 255, 255, 0.6)",
                      mb: 1,
                      fontSize: "0.75rem",
                    }}
                  >
                    Net APY
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ color: "#10B981", fontWeight: 600 }}
                  >
                    {loadingUser
                      ? "..."
                      : user?.netAPY
                      ? `${(user.netAPY * 100).toFixed(2)}%`
                      : "0.00%"}
                  </Typography>
                </div>
              </div>

              {/* Tap indicator */}
              <div className="text-center">
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.4)",
                    mb: 1,
                    fontSize: "0.75rem",
                  }}
                >
                  Tap for details
                </Typography>
                <div className="w-6 h-0.5 bg-gray-600 rounded-full mx-auto"></div>
              </div>
            </div>
          </CardContent>
        </StatsCard>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
          mb: 4,
        }}
      >
        <CustomTabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <CustomTab label="Your Supplies" />
          <CustomTab label="Assets to Supply" />
        </CustomTabs>
      </Box>

      {/* Tab Content */}
      <div className="mt-6">
        {currentTab === 0 ? <YourSupplies /> : <SupplyAssetsList />}
      </div>

      {/* Bottom Sheet Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 300,
          sx: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
        }}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <Fade in={isModalOpen} timeout={400}>
          <BottomSheet>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
                Portfolio Overview
              </Typography>
              <IconButton
                onClick={handleCloseModal}
                size="small"
                sx={{
                  color: "rgba(255, 255, 255, 0.6)",
                  "&:hover": {
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto">
              {/* Stats Sections */}
              <div className="space-y-4">
                {/* Net Worth Section */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      mb: 2,
                      fontSize: "0.875rem",
                    }}
                  >
                    Net Worth
                  </Typography>
                  <Paper
                    sx={{
                      p: 3,
                      background: "rgba(55, 65, 81, 0.3)",
                      border: "1px solid rgba(75, 85, 99, 0.3)",
                      borderRadius: "8px",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ color: "white", fontWeight: 600, mb: 2 }}
                    >
                      {loadingUser
                        ? "..."
                        : `$${
                            user?.netWorthUSD
                              ? (+user.netWorthUSD).toFixed(2)
                              : "0.00"
                          }`}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.875rem",
                      }}
                    >
                      Total portfolio value across all supplied assets and
                      borrowed positions
                    </Typography>
                  </Paper>
                </Box>

                {/* APY Section */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      mb: 2,
                      fontSize: "0.875rem",
                    }}
                  >
                    Net APY
                  </Typography>
                  <Paper
                    sx={{
                      p: 3,
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "8px",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ color: "#10B981", fontWeight: 600, mb: 2 }}
                    >
                      {loadingUser
                        ? "..."
                        : user?.netAPY
                        ? `${(user.netAPY * 100).toFixed(2)}%`
                        : "0.00%"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.875rem",
                      }}
                    >
                      Weighted average annual percentage yield across all
                      positions
                    </Typography>
                  </Paper>
                </Box>
              </div>
            </div>

            {/* Close Button */}
            <Button
              variant="contained"
              fullWidth
              size="medium"
              onClick={handleCloseModal}
              sx={{
                background: "#374151",
                color: "white",
                py: 1.5,
                fontSize: "0.875rem",
                fontWeight: 500,
                borderRadius: "8px",
                mt: 4,
                "&:hover": {
                  background: "#4B5563",
                },
              }}
            >
              Close
            </Button>
          </BottomSheet>
        </Fade>
      </Modal>
    </main>
  );
}
