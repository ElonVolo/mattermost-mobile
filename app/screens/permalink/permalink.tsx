// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, BackHandler, Text, TouchableOpacity, View} from 'react-native';
import Animated from 'react-native-reanimated';
import {Edge, SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import {fetchChannelById, joinChannel, switchToChannelById} from '@actions/remote/channel';
import {fetchPostById, fetchPostsAround} from '@actions/remote/post';
import {addUserToTeam, fetchTeamByName, removeUserFromTeam} from '@actions/remote/team';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import Loading from '@components/loading';
import PostList from '@components/post_list';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import DatabaseManager from '@database/manager';
import {getChannelById, getMyChannel} from '@queries/servers/channel';
import {dismissModal} from '@screens/navigation';
import EphemeralStore from '@store/ephemeral_store';
import {closePermalink} from '@utils/permalink';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import {ErrorType} from './common';
import PermalinkError from './permalink_error';

import type ChannelModel from '@typings/database/models/servers/channel';
import type PostModel from '@typings/database/models/servers/post';

type Props = {
    postId: PostModel['id'];
    channel?: ChannelModel;
    teamName?: string;
    isTeamMember?: boolean;
    currentUserId: string;
    currentTeamId: string;
}

const edges: Edge[] = ['left', 'right', 'top'];

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flex: 1,
        marginTop: 20,
    },
    wrapper: {
        backgroundColor: theme.centerChannelBg,
        borderRadius: 6,
        flex: 1,
        margin: 10,
        opacity: 1,
    },
    header: {
        alignItems: 'center',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        flexDirection: 'row',
        height: 44,
        paddingRight: 16,
        width: '100%',
    },
    dividerContainer: {
        backgroundColor: theme.centerChannelBg,
    },
    divider: {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
        height: 1,
    },
    close: {
        justifyContent: 'center',
        height: 44,
        width: 40,
        paddingLeft: 7,
    },
    titleContainer: {
        alignItems: 'center',
        flex: 1,
        paddingRight: 40,
    },
    title: {
        color: theme.centerChannelColor,
        fontSize: 17,
        fontWeight: '600',
    },
    postList: {
        flex: 1,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.buttonBg,
        flexDirection: 'row',
        height: 43,
        paddingRight: 16,
        width: '100%',
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
    },
    jump: {
        color: theme.buttonColor,
        fontSize: 15,
        fontWeight: '600',
        textAlignVertical: 'center',
    },
}),
);

function Permalink({
    channel,
    postId,
    teamName,
    isTeamMember,
    currentUserId,
    currentTeamId,
}: Props) {
    const [posts, setPosts] = useState<PostModel[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const insets = useSafeAreaInsets();
    const style = getStyleSheet(theme);
    const [error, setError] = useState<ErrorType>();
    const [channelId, setChannelId] = useState(channel?.id);

    const containerStyle = useMemo(() =>
        [style.container, {marginBottom: insets.bottom}],
    [style, insets.bottom]);

    useEffect(() => {
        (async () => {
            if (channelId) {
                const data = await fetchPostsAround(serverUrl, channelId, postId, 5);
                if (data.error) {
                    setError({unreachable: true});
                }
                if (data?.posts) {
                    setPosts(data.posts);
                }
                setLoading(false);
                return;
            }

            const database = DatabaseManager.serverDatabases[serverUrl]?.database;
            if (!database) {
                setError({unreachable: true});
                setLoading(false);
                return;
            }

            // If a team is provided, try to join the team, but do not fail here, to take into account:
            // - Wrong team name
            // - DMs/GMs
            let joinedTeam: Team | undefined;
            if (teamName && !isTeamMember) {
                const fetchData = await fetchTeamByName(serverUrl, teamName, true);
                joinedTeam = fetchData.team;

                if (joinedTeam) {
                    const addData = await addUserToTeam(serverUrl, joinedTeam.id, currentUserId);
                    if (addData.error) {
                        joinedTeam = undefined;
                    }
                }
            }

            const {post} = await fetchPostById(serverUrl, postId, true);
            if (!post) {
                if (joinedTeam) {
                    removeUserFromTeam(serverUrl, joinedTeam.id, currentUserId);
                }
                setError({notExist: true});
                setLoading(false);
                return;
            }

            const myChannel = await getMyChannel(database, post.channel_id);
            if (myChannel) {
                const localChannel = await getChannelById(database, myChannel.id);

                // Wrong team passed or DM/GM
                if (joinedTeam && localChannel?.teamId !== '' && localChannel?.teamId !== joinedTeam.id) {
                    removeUserFromTeam(serverUrl, joinedTeam.id, currentUserId);
                    joinedTeam = undefined;
                }

                if (joinedTeam) {
                    setError({
                        joinedTeam: true,
                        channelId: myChannel.id,
                        channelName: localChannel?.displayName,
                        privateTeam: !joinedTeam?.allow_open_invite,
                        teamName: joinedTeam?.display_name,
                        teamId: joinedTeam?.id,
                    });
                    setLoading(false);
                    return;
                }
                setChannelId(post.channel_id);
                return;
            }

            const {channel: fetchedChannel} = await fetchChannelById(serverUrl, post.channel_id);
            if (!fetchedChannel) {
                if (joinedTeam) {
                    removeUserFromTeam(serverUrl, joinedTeam.id, currentUserId);
                }
                setError({notExist: true});
                setLoading(false);
                return;
            }

            // Wrong team passed or DM/GM
            if (joinedTeam && fetchedChannel.team_id !== '' && fetchedChannel.team_id !== joinedTeam.id) {
                removeUserFromTeam(serverUrl, joinedTeam.id, currentUserId);
                joinedTeam = undefined;
            }

            setError({
                privateChannel: fetchedChannel.type === 'P',
                joinedTeam: Boolean(joinedTeam),
                channelId: fetchedChannel.id,
                channelName: fetchedChannel.display_name,
                teamId: fetchedChannel.team_id || currentTeamId,
                teamName: joinedTeam?.display_name,
                privateTeam: !joinedTeam?.allow_open_invite,
            });
            setLoading(false);
        })();
    }, [channelId, teamName]);

    const handleClose = useCallback(() => {
        if (error?.joinedTeam && error.teamId) {
            removeUserFromTeam(serverUrl, error.teamId, currentUserId);
        }
        dismissModal({componentId: Screens.PERMALINK});
        closePermalink();
    }, [error]);

    useEffect(() => {
        const listener = BackHandler.addEventListener('hardwareBackPress', () => {
            if (EphemeralStore.getNavigationTopComponentId() === Screens.PERMALINK) {
                handleClose();
                return true;
            }

            return false;
        });

        return () => {
            listener.remove();
        };
    }, []);

    const handlePress = useCallback(preventDoubleTap(() => {
        if (channel) {
            switchToChannelById(serverUrl, channel?.id, channel?.teamId);
        }
    }), []);

    const handleJoin = useCallback(preventDoubleTap(async () => {
        if (error?.teamId && error.channelId) {
            const {error: joinError} = await joinChannel(serverUrl, currentUserId, error.teamId, error.channelId);
            if (joinError) {
                Alert.alert('Error joining the channel', 'There was an error trying to join the channel');
                return;
            }
            setLoading(true);
            setError(undefined);
            setChannelId(error.channelId);
        }
    }), [error, serverUrl, currentUserId]);

    let content;
    if (loading) {
        content = (
            <View style={style.loading}>
                <Loading
                    color={theme.buttonBg}
                />
            </View>
        );
    } else if (error) {
        content = (
            <PermalinkError
                error={error}
                handleClose={handleClose}
                handleJoin={handleJoin}
            />
        );
    } else {
        content = (
            <>
                <View style={style.postList}>
                    <PostList
                        highlightedId={postId}
                        posts={posts}
                        location={Screens.PERMALINK}
                        lastViewedAt={0}
                        shouldShowJoinLeaveMessages={false}
                        channelId={channel!.id}
                        testID='permalink.post_list'
                        nativeID={Screens.PERMALINK}
                        highlightPinnedOrSaved={false}
                    />
                </View>
                <TouchableOpacity
                    style={style.footer}
                    onPress={handlePress}
                    testID='permalink.jump_to_recent_messages.button'
                >
                    <FormattedText
                        testID='permalink.search.jump'
                        id='mobile.search.jump'
                        defaultMessage='Jump to recent messages'
                        style={style.jump}
                    />
                </TouchableOpacity>
            </>
        );
    }

    const showHeaderDivider = Boolean(channelId) && !error && !loading;
    return (
        <SafeAreaView
            style={containerStyle}
            testID='permalink.screen'
            edges={edges}
        >
            <Animated.View style={style.wrapper}>
                <View style={style.header}>
                    <TouchableOpacity
                        style={style.close}
                        onPress={handleClose}
                    >
                        <CompassIcon
                            name='close'
                            size={20}
                            color={theme.centerChannelColor}
                        />
                    </TouchableOpacity>
                    <View style={style.titleContainer}>
                        <Text
                            ellipsizeMode='tail'
                            numberOfLines={1}
                            style={style.title}
                        >
                            {channel?.displayName}
                        </Text>
                    </View>
                </View>
                {showHeaderDivider && (
                    <View style={style.dividerContainer}>
                        <View style={style.divider}/>
                    </View>
                )}
                {content}
            </Animated.View>
        </SafeAreaView>
    );
}

export default Permalink;
