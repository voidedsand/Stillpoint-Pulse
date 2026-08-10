// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Stillpoint {
    uint8 public constant MAX_DAILY_ENTRIES = 5;

    struct Profile {
        uint64 totalEntries;
        uint64 totalCheckIns;
        uint32 streak;
        uint64 lastCheckInDay;
        uint8 todayEntries;
        uint64 lastEntryDay;
        uint8 lastState;
        uint64 lastEntryAt;
    }

    mapping(address => Profile) private profiles;

    uint64 public globalEntries;
    uint64 public globalCheckIns;

    event StateRecorded(address indexed user, uint8 indexed state, uint64 indexed day, uint8 entryNumber);
    event DailyCheckIn(address indexed user, uint64 indexed day, uint32 streak);

    error InvalidState();
    error DailyEntryLimitReached();
    error AlreadyCheckedInToday();

    function recordState(uint8 state) external {
        if (state > 4) revert InvalidState();

        uint64 day = uint64(block.timestamp / 1 days);
        Profile storage profile = profiles[msg.sender];

        if (profile.lastEntryDay != day) {
            profile.lastEntryDay = day;
            profile.todayEntries = 0;
        }
        if (profile.todayEntries >= MAX_DAILY_ENTRIES) revert DailyEntryLimitReached();

        unchecked {
            profile.todayEntries += 1;
            profile.totalEntries += 1;
            globalEntries += 1;
        }
        profile.lastState = state;
        profile.lastEntryAt = uint64(block.timestamp);

        emit StateRecorded(msg.sender, state, day, profile.todayEntries);
    }

    function dailyCheckIn() external {
        uint64 day = uint64(block.timestamp / 1 days);
        Profile storage profile = profiles[msg.sender];

        if (profile.lastCheckInDay == day) revert AlreadyCheckedInToday();

        if (profile.lastCheckInDay != 0 && profile.lastCheckInDay + 1 == day) {
            unchecked {
                profile.streak += 1;
            }
        } else {
            profile.streak = 1;
        }

        profile.lastCheckInDay = day;
        unchecked {
            profile.totalCheckIns += 1;
            globalCheckIns += 1;
        }

        emit DailyCheckIn(msg.sender, day, profile.streak);
    }

    function statsOf(address user) external view returns (Profile memory stats) {
        stats = profiles[user];
        uint64 day = uint64(block.timestamp / 1 days);
        if (stats.lastEntryDay != day) stats.todayEntries = 0;
    }
}
