"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { SupplyAssetsList } from "@/components/ui/supply/SupplyAssetsList";
import { YourSupplies } from "@/components/ui/supply/YourSupplies";
import { useAccount, useConnect, useDisconnect } from "wagmi";
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
import { useDetectClickOutside } from "~/hooks/useDetectClickOutside";
import { truncateAddress } from "../lib/truncateAddress";

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
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { user, loading: loadingUser } = useAppDataContext();
  const { context } = useMiniApp();
  const { disconnect } = useDisconnect();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  useDetectClickOutside(profileRef, () => setProfileOpen(false));
  const [copied, setCopied] = useState(false);
  console.log(context, "context");

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
          {/* Logo in white circle */}
          <div className="w-200 h-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image src="/logo.png" alt="Logo" width={48} height={48} />
          </div>

          <h1 className="text-2xl font-semibold text-white mb-2">
            Earn on Aave
          </h1>

          <p className="text-gray-400 mb-8 text-sm">
            Connect your wallet to start earning yield
          </p>
        </div>

        {/* Profile picture on top right */}
        {context?.user?.pfpUrl && (
          <div className="absolute top-4 right-4">
            <img
              src={context.user.pfpUrl}
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
            />
          </div>
        )}

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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="relative">
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 backdrop-blur-3xl"></div>

        <div className="relative container mx-auto max-w-7xl px-6 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Enhanced Logo */}
              <div className="relative group">
                <div className="relative w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <Image src="/logo.png" alt="Logo" width={36} height={36} />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  Earn on Aave
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Maximize your crypto returns
                </p>
              </div>
            </div>

            {/* Enhanced Profile */}
            {context?.user?.pfpUrl && (
              <div className="relative group" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="relative"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <img
                    src={context.user.pfpUrl}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border-2 border-white/20 shadow-xl backdrop-blur-sm"
                  />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700/50 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-700/50 space-y-1">
                      <p className="text-xs text-gray-400">Profile</p>
                      {isConnected && address ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-white/80">
                            {truncateAddress(address)}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(address);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 1200);
                              } catch {}
                            }}
                            className="text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
                          >
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-white/80">Signed out</p>
                      )}
                    </div>
                    {/* Quick Connect / Switch */}
                    <div className="p-2 space-y-1">
                      {connectors?.[0] && (
                        <button
                          onClick={() => {
                            connect({ connector: connectors[0] });
                            setProfileOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-white/90 hover:bg-gray-800 rounded"
                        >
                          Connect Farcaster
                        </button>
                      )}
                      {connectors?.[1] && (
                        <button
                          onClick={() => {
                            connect({ connector: connectors[1] });
                            setProfileOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-white/90 hover:bg-gray-800 rounded"
                        >
                          Connect Coinbase Wallet
                        </button>
                      )}
                      {connectors?.[2] && (
                        <button
                          onClick={() => {
                            connect({ connector: connectors[2] });
                            setProfileOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-white/90 hover:bg-gray-800 rounded"
                        >
                          Connect MetaMask
                        </button>
                      )}
                    </div>
                    <div className="border-t border-gray-700/50" />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        disconnect();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Elegant separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-6"></div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 py-8">
        {/* Enhanced Stats Card */}
        <div className="relative mb-8 group">
          {/* Glowing background effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-60 group-hover:opacity-100"></div>

          <StatsCard
            onClick={handleCardClick}
            sx={{
              position: "relative",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "16px",
              overflow: "hidden",
              cursor: "pointer",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.3)",
              },
            }}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>

            <CardContent sx={{ p: 4, position: "relative" }}>
              <div className="flex items-center justify-between gap-6">
                {/* Net Worth Box */}
                <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 w-full max-w-xs">
                  <div className="mb-2">
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        letterSpacing: 0.5,
                      }}
                    >
                      Net Worth
                    </Typography>
                  </div>
                  <Typography
                    variant="h4"
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "1.5rem",
                      background:
                        "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {loadingUser
                      ? "..."
                      : `$${
                          user?.netWorthUSD
                            ? (+user.netWorthUSD).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "0.00"
                        }`}
                  </Typography>
                </div>

                {/* Net APY Box */}
                <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 w-full max-w-xs">
                  <div className="mb-2">
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        letterSpacing: 0.5,
                      }}
                    >
                      Net APY
                    </Typography>
                  </div>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.5rem",
                      background:
                        "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {loadingUser
                      ? "..."
                      : user?.netAPY
                      ? `${(user.netAPY * 100).toFixed(2)}%`
                      : "0.00%"}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </StatsCard>
        </div>

        {/* Enhanced Tabs */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-xl blur-xl"></div>
          <Box
            sx={{
              position: "relative",
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              p: 1,
            }}
          >
            <CustomTabs
              value={currentTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                "& .MuiTab-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  textTransform: "none",
                  borderRadius: "8px",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    color: "rgba(255, 255, 255, 0.9)",
                    background: "rgba(255, 255, 255, 0.05)",
                  },
                  "&.Mui-selected": {
                    color: "white",
                    background:
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.5) 0%, rgba(147, 51, 234, 0.5) 100%)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
                  },
                },
                "& .MuiTabs-indicator": {
                  display: "none",
                },
              }}
            >
              <CustomTab
                label={
                  <div className="flex items-center gap-2">Your Supplies</div>
                }
              />
              <CustomTab
                label={
                  <div className="flex items-center gap-2">Supply asset</div>
                }
              />
            </CustomTabs>
          </Box>
        </div>

        {/* Enhanced Tab Content */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl"></div>
          <div className="relative backdrop-blur-sm">
            {currentTab === 0 ? <YourSupplies /> : <SupplyAssetsList />}
          </div>
        </div>
      </div>
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 300,
          sx: { backgroundColor: "rgba(0, 0, 0, 0.8)" },
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Fade in={isModalOpen} timeout={400}>
          <BottomSheet
            sx={{
              minHeight: "100vh",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 font-primary">
              <Typography
                variant="h6"
                sx={{
                  color: "white",
                  fontWeight: 600,
                  fontSize: "1.5rem",
                  lineHeight: 1.2,
                }}
              >
                Earning
              </Typography>
              <IconButton
                onClick={handleCloseModal}
                size="small"
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  "&:hover": {
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  },
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </div>

            {/* Subtitle */}
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                mb: 4,
                fontSize: "1rem",
                lineHeight: 1.5,
              }}
            >
              Put your crypto to work. Supply assets to earn interest from
              borrowers.
            </Typography>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto">
              {/* Stats Cards */}
              <div className="space-y-4 mb-8">
                {/* Total Earning Card */}
                <Paper
                  sx={{
                    p: 3,
                    background: "rgba(55, 65, 81, 0.3)",
                    border: "1px solid rgba(75, 85, 99, 0.3)",
                    borderRadius: "12px",
                  }}
                >
                  <div className="flex items-center justify-between font-primary">
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "1rem",
                        fontWeight: 400,
                      }}
                    >
                      Net Worth
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        color: "white",
                        fontWeight: 600,
                        fontSize: "1.5rem",
                      }}
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
                </Paper>

                {/* Net APY Card */}
                <Paper
                  sx={{
                    p: 3,
                    background: "rgba(55, 65, 81, 0.3)",
                    border: "1px solid rgba(75, 85, 99, 0.3)",
                    borderRadius: "12px",
                  }}
                >
                  <div className="flex items-center justify-between font-primary">
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "1rem",
                        fontWeight: 400,
                      }}
                    >
                      Net APY
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        color: "white",
                        fontWeight: 600,
                        fontSize: "1.5rem",
                      }}
                    >
                      {loadingUser
                        ? "..."
                        : user?.netAPY
                        ? `${(user.netAPY * 100).toFixed(0)}%`
                        : "0%"}
                    </Typography>
                  </div>
                </Paper>
              </div>

              {/* Information Section */}
              <div className="space-y-4">
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    fontSize: "1.25rem",
                    mb: 2,
                  }}
                >
                  Where does the yield come from?
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "1rem",
                    lineHeight: 1.6,
                    mb: 3,
                  }}
                >
                  When you supply assets to Aave, they're lent to borrowers who
                  pay interest. That interest becomes your yield.
                </Typography>
              </div>
            </div>

            {/* Close Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleCloseModal}
              sx={{
                background: "rgba(255, 255, 255, 0.08)",
                color: "white",
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
                borderRadius: "9999px",
                mt: 4,
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.12)",
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
